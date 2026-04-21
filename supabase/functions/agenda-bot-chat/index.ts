import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é uma SECRETÁRIA COMERCIAL PREMIUM especialista em AGENDAMENTO DE VISITAS de uma imobiliária. Aja como humana real: simpática, profissional, organizada, NUNCA robótica.

PERSONA:
- Português brasileiro, natural, elegante.
- 1-2 emojis estratégicos por mensagem.
- UMA pergunta por vez, sem afobar.
- Respostas curtas (máximo 3 linhas).

OBJETIVO: Agendar visita a um imóvel anunciado e qualificar o lead. NÃO ofereça avaliação nem pergunte se quer anunciar imóvel.

FLUXO (siga em ordem, UMA pergunta por vez):
1) Pergunte qual imóvel deseja visitar (peça código do imóvel, endereço, ou descrição: bairro/tipo/quartos)
2) Nome completo
3) WhatsApp para confirmação
4) Melhor DIA para visitar (aceite formatos como "amanhã", "sexta", "20/04", "20/04/2026")
5) Melhor HORÁRIO (aceite "manhã", "14h", "14:30")
6) Encerre confirmando que a visita foi registrada e o corretor confirmará pelo WhatsApp.

REGRAS:
- Se a resposta vier incompleta, peça o complemento educadamente.
- Se demonstrar urgência, sugira o próximo dia útil.
- Se perguntar preço, diga que está no anúncio e siga o fluxo.

IMPORTANTE: Assim que tiver TODOS os campos (imóvel + nome + telefone + dia + hora), chame a ferramenta save_visit com os dados extraídos. NÃO chame antes de ter tudo. A ferramenta retorna sucesso ou erro — se sucesso, finalize agradecendo.`;

const SAVE_VISIT_TOOL = {
  type: "function",
  function: {
    name: "save_visit",
    description: "Salva o agendamento de visita quando todos os dados foram coletados (imóvel + nome + telefone + dia + hora).",
    parameters: {
      type: "object",
      properties: {
        property_query: { type: "string", description: "Texto livre do imóvel: código, endereço ou descrição (bairro/tipo/quartos)." },
        client_name: { type: "string", description: "Nome completo do cliente" },
        client_phone: { type: "string", description: "Telefone/WhatsApp do cliente" },
        visit_date_text: { type: "string", description: "Data da visita como o cliente disse (ex: 'amanhã', 'sexta', '20/04')" },
        visit_time_text: { type: "string", description: "Horário da visita (ex: '14h', 'manhã', '14:30')" },
        notes: { type: "string", description: "Observações adicionais relevantes do cliente" },
      },
      required: ["property_query", "client_name", "client_phone", "visit_date_text", "visit_time_text"],
      additionalProperties: false,
    },
  },
};

// Match propriedade via IA simples — usa heurística + fallback
async function matchProperty(supabase: any, sellerId: string, query: string, apiKey: string): Promise<{ item_id: string | null; confidence: number; guess: string }> {
  const { data: items } = await supabase
    .from("seller_items")
    .select("id, title, address, city, neighborhood, bedrooms, category, slug")
    .eq("seller_id", sellerId)
    .eq("status", "ativo")
    .limit(60);

  if (!items || items.length === 0) {
    return { item_id: null, confidence: 0, guess: query };
  }

  // Tentativa 1: query é um código UUID-like ou slug
  const cleanQuery = query.trim().toLowerCase();
  const direct = items.find((i: any) =>
    (i.slug && cleanQuery.includes(i.slug.toLowerCase())) ||
    (i.id && cleanQuery.includes(i.id.toLowerCase()))
  );
  if (direct) return { item_id: direct.id, confidence: 1, guess: direct.title };

  // Tentativa 2: IA escolhe o melhor match
  const list = items.map((i: any, idx: number) =>
    `${idx + 1}. id=${i.id} | ${i.title} | ${i.category} | ${i.neighborhood || ""} | ${i.city || ""} | ${i.bedrooms || "?"} quartos`
  ).join("\n");

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Você é um classificador. Responda APENAS com JSON {\"id\": \"<uuid>\" | null, \"confidence\": 0-1}. Se nenhum imóvel da lista combina com o pedido do cliente, retorne id=null e confidence=0." },
          { role: "user", content: `IMÓVEIS DA LOJA:\n${list}\n\nPEDIDO DO CLIENTE: "${query}"\n\nQual imóvel mais combina? Responda só o JSON.` },
        ],
        max_tokens: 100,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const txt = data.choices?.[0]?.message?.content || "";
      const jsonMatch = txt.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.id && parsed.confidence > 0.4) {
          const found = items.find((i: any) => i.id === parsed.id);
          if (found) return { item_id: found.id, confidence: parsed.confidence, guess: found.title };
        }
      }
    }
  } catch (e) {
    console.error("AI match error:", e);
  }

  return { item_id: null, confidence: 0, guess: query };
}

// Parser básico de data — IA também ajuda
async function parseDateTime(dateText: string, timeText: string, apiKey: string): Promise<{ date: string; time: string }> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: `Hoje é ${todayStr} (${today.toLocaleDateString("pt-BR", { weekday: "long" })}). Responda APENAS com JSON {"date":"YYYY-MM-DD","time":"HH:MM"}. Se data ambígua, use o próximo dia futuro. Se hora ambígua: manhã=09:00, tarde=14:00, noite=18:00. Se não conseguir parsear, use date=hoje+1 e time=10:00.` },
          { role: "user", content: `Data: "${dateText}"\nHorário: "${timeText}"` },
        ],
        max_tokens: 80,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const txt = data.choices?.[0]?.message?.content || "";
      const jsonMatch = txt.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.date && parsed.time) return parsed;
      }
    }
  } catch (e) {
    console.error("Date parse error:", e);
  }

  // Fallback: amanhã às 10:00
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { date: tomorrow.toISOString().slice(0, 10), time: "10:00" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { messages = [], sellerId, sellerName } = body;

    if (!sellerId) {
      return new Response(JSON.stringify({ error: "sellerId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Saudação inicial
    if (messages.length === 0) {
      const tag = sellerName ? ` à ${sellerName}` : "";
      return new Response(JSON.stringify({
        reply: `Olá! 👋 Seja bem-vindo(a)${tag}! Vou te ajudar a agendar uma visita ao imóvel. 📅\n\nPara começar, qual imóvel você gostaria de visitar? Pode me dizer o código, endereço ou descrever (bairro, tipo, quartos).`,
        savedVisit: null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let systemPrompt = SYSTEM_PROMPT;
    if (sellerName) systemPrompt += `\n\nVocê está representando "${sellerName}". Mencione o nome quando apropriado.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 350,
        tools: [SAVE_VISIT_TOOL],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas mensagens. Aguarde um instante." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const choice = data.choices?.[0];
    let reply = choice?.message?.content || "";
    let savedVisit: any = null;

    const toolCalls = choice?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      for (const tc of toolCalls) {
        if (tc.function?.name === "save_visit") {
          try {
            const args = JSON.parse(tc.function.arguments);

            // 1) Match imóvel
            const match = await matchProperty(supabase, sellerId, args.property_query, apiKey);
            // 2) Parse data/hora
            const dt = await parseDateTime(args.visit_date_text, args.visit_time_text, apiKey);

            // 3) Buscar profile dono da loja
            const { data: profile } = await supabase
              .from("profiles")
              .select("user_id, full_name, company_name, city")
              .eq("id", sellerId)
              .maybeSingle();

            if (!profile) throw new Error("Loja não encontrada");

            // 4) Buscar dados do imóvel se vinculado
            let propertyType: string | null = null;
            let propertyCode: string | null = null;
            let address: string | null = null;
            let city: string | null = profile.city;
            if (match.item_id) {
              const { data: itm } = await supabase
                .from("seller_items")
                .select("category, address, city, slug")
                .eq("id", match.item_id)
                .maybeSingle();
              if (itm) {
                propertyType = itm.category;
                propertyCode = itm.slug;
                address = itm.address;
                city = itm.city || profile.city;
              }
            }

            // 5) Criar visita pendente_confirmacao
            const { data: visit, error: visitErr } = await supabase
              .from("visit_appointments")
              .insert({
                user_id: profile.user_id,
                seller_id: sellerId,
                client_name: (args.client_name || "").slice(0, 100),
                client_phone: (args.client_phone || "").slice(0, 30),
                visit_date: dt.date,
                visit_time: dt.time,
                item_id: match.item_id,
                property_type: propertyType,
                property_code: propertyCode,
                address: address || (match.item_id ? null : args.property_query?.slice(0, 200)),
                city,
                status: "pendente_confirmacao",
                source: "bot",
                ai_match_confidence: match.confidence,
                ai_property_guess: match.guess,
                notes: args.notes || `Agendamento via bot. Pedido: "${args.property_query}"`,
              })
              .select()
              .single();

            if (visitErr) {
              console.error("Insert visit error:", visitErr);
              throw visitErr;
            }

            savedVisit = visit;

            if (!reply) {
              reply = `Perfeito, ${args.client_name?.split(" ")[0] || ""}! ✅ Sua visita foi registrada para ${new Date(dt.date + "T00:00:00").toLocaleDateString("pt-BR")} às ${dt.time}. Nosso corretor vai confirmar o agendamento pelo WhatsApp em instantes! 🏡`;
            }
          } catch (e) {
            console.error("save_visit error:", e);
            if (!reply) reply = "Ops! Tive um problema ao registrar a visita. Pode me confirmar os dados novamente?";
          }
        }
      }
    }

    if (!reply) reply = "Desculpe, pode repetir?";

    return new Response(JSON.stringify({ reply, savedVisit }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agenda-bot-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
