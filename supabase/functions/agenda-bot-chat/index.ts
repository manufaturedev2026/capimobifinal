import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { consumeAiCreditsForUser, refundAiCredits } from "../_shared/ai-credits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALIDATION_RULES = `
REGRAS RÍGIDAS DE VALIDAÇÃO (CRÍTICO — siga sem exceções):

1) NOME COMPLETO:
   - Deve ter PELO MENOS 2 palavras (nome + sobrenome), só letras e espaços, mínimo 4 letras totais.
   - REJEITE: "asd", "kkk", "oi", "teste", "sim", "não", números soltos, palavras únicas curtas, qualquer coisa que claramente não seja nome humano.
   - Se inválido, NÃO avance. Diga gentilmente: "Pode me dizer seu nome completo, por favor? (nome e sobrenome) 😊" e PERGUNTE DE NOVO.

2) TELEFONE / WHATSAPP:
   - Deve conter PELO MENOS 10 dígitos (DDD + número). Aceite formatos com (), -, espaços.
   - REJEITE: "não tenho", "depois", textos sem números, números com menos de 10 dígitos.
   - Se inválido, peça novamente: "Preciso do seu WhatsApp com DDD para a confirmação 📱 Pode me passar?"

3) DIA DA VISITA:
   - Aceite: "hoje", "amanhã", dias da semana ("sexta", "segunda"), datas ("30/04", "5 de maio").
   - REJEITE respostas vagas: "qualquer dia", "sei lá", "você escolhe", "depois". Peça uma data concreta.

4) HORÁRIO:
   - Aceite: "manhã", "tarde", "noite", "14h", "14:30", "às 9".
   - REJEITE: "qualquer hora", "tanto faz". Peça período (manhã/tarde/noite) ou hora específica.

5) FLUXO OBRIGATÓRIO:
   - NUNCA pule uma etapa só porque o usuário respondeu algo. CONFIRME que a resposta atende a regra acima ANTES de avançar.
   - NUNCA chame save_visit com dados que não passaram nas validações acima.
   - Se o usuário tentar enrolar 3+ vezes na mesma pergunta, diga: "Sem esses dados não consigo agendar 😔 Posso te ajudar de outra forma?" e PARE.

6) ANTI-ALUCINAÇÃO:
   - NUNCA invente nome, telefone ou data. Use APENAS o que o usuário escreveu literalmente.
   - Se faltou qualquer campo, NÃO chame save_visit ainda.`;

const SYSTEM_PROMPT_PRELINKED = `Você é uma SECRETÁRIA COMERCIAL PREMIUM brasileira, especialista em AGENDAMENTO DE VISITAS. Aja como humana real: simpática, profissional, atenta. NUNCA robótica.

PERSONA:
- Português brasileiro, natural, elegante.
- 1-2 emojis por mensagem. UMA pergunta por vez. Respostas curtas (máx 3 linhas).

OBJETIVO: Agendar visita ao imóvel JÁ DEFINIDO {{PROPERTY_INFO}}. NÃO pergunte qual imóvel — já está pré-selecionado.

FLUXO OBRIGATÓRIO (uma pergunta por vez, NA ORDEM, validando cada resposta):
1) Confirme breve interesse (cite o título do imóvel).
2) NOME COMPLETO do cliente (validar regra #1).
3) WHATSAPP com DDD (validar regra #2).
4) DIA preferido para a visita (validar regra #3).
5) HORÁRIO (validar regra #4).
6) Após TODOS validados, chame save_visit e confirme o agendamento.
${VALIDATION_RULES}`;

const SYSTEM_PROMPT_OPEN = `Você é uma SECRETÁRIA COMERCIAL PREMIUM brasileira, especialista em AGENDAMENTO DE VISITAS. Aja como humana real: simpática, profissional, atenta. NUNCA robótica.

PERSONA:
- Português brasileiro, natural, elegante.
- 1-2 emojis por mensagem. UMA pergunta por vez. Respostas curtas (máx 3 linhas).

OBJETIVO: Agendar visita a um imóvel anunciado.

FLUXO OBRIGATÓRIO (uma pergunta por vez, NA ORDEM, validando cada resposta):
1) Qual imóvel deseja visitar (código, endereço ou bairro/tipo/quartos). Se vier vago ("qualquer um", "não sei"), peça mais detalhes.
2) NOME COMPLETO (validar regra #1).
3) WHATSAPP com DDD (validar regra #2).
4) DIA preferido (validar regra #3).
5) HORÁRIO (validar regra #4).
6) Após TODOS validados, chame save_visit.
${VALIDATION_RULES}`;

const SAVE_VISIT_TOOL_OPEN = {
  type: "function",
  function: {
    name: "save_visit",
    description: "Salva o agendamento quando todos os dados foram coletados.",
    parameters: {
      type: "object",
      properties: {
        property_query: { type: "string", description: "Texto livre do imóvel (código/endereço/descrição)." },
        client_name: { type: "string" },
        client_phone: { type: "string" },
        visit_date_text: { type: "string" },
        visit_time_text: { type: "string" },
        notes: { type: "string" },
      },
      required: ["property_query", "client_name", "client_phone", "visit_date_text", "visit_time_text"],
      additionalProperties: false,
    },
  },
};

const SAVE_VISIT_TOOL_PRELINKED = {
  type: "function",
  function: {
    name: "save_visit",
    description: "Salva o agendamento ao imóvel pré-vinculado quando os dados do cliente foram coletados.",
    parameters: {
      type: "object",
      properties: {
        client_name: { type: "string" },
        client_phone: { type: "string" },
        visit_date_text: { type: "string" },
        visit_time_text: { type: "string" },
        notes: { type: "string" },
      },
      required: ["client_name", "client_phone", "visit_date_text", "visit_time_text"],
      additionalProperties: false,
    },
  },
};

async function matchProperty(supabase: any, sellerId: string, query: string, apiKey: string): Promise<{ item_id: string | null; confidence: number; guess: string }> {
  const { data: items } = await supabase
    .from("seller_items")
    .select("id, title, address, city, neighborhood, bedrooms, category, slug")
    .eq("seller_id", sellerId).eq("status", "ativo").limit(60);
  if (!items || items.length === 0) return { item_id: null, confidence: 0, guess: query };
  const cleanQuery = query.trim().toLowerCase();
  const direct = items.find((i: any) =>
    (i.slug && cleanQuery.includes(i.slug.toLowerCase())) || (i.id && cleanQuery.includes(i.id.toLowerCase())));
  if (direct) return { item_id: direct.id, confidence: 1, guess: direct.title };
  const list = items.map((i: any) => `id=${i.id} | ${i.title} | ${i.category} | ${i.neighborhood || ""} | ${i.bedrooms || "?"}q`).join("\n");
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Classificador. Responda APENAS JSON {\"id\":\"<uuid>\"|null,\"confidence\":0-1}." },
          { role: "user", content: `IMÓVEIS:\n${list}\n\nPEDIDO: "${query}"\nQual mais combina?` },
        ],
        max_tokens: 100,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const txt = data.choices?.[0]?.message?.content || "";
      const m = txt.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        if (parsed.id && parsed.confidence > 0.4) {
          const f = items.find((i: any) => i.id === parsed.id);
          if (f) return { item_id: f.id, confidence: parsed.confidence, guess: f.title };
        }
      }
    }
  } catch (e) { console.error("AI match error:", e); }
  return { item_id: null, confidence: 0, guess: query };
}

async function parseDateTime(dateText: string, timeText: string, apiKey: string): Promise<{ date: string; time: string }> {
  // Usa fuso de São Paulo (America/Sao_Paulo) para evitar bug de UTC à noite
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    weekday: "long",
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const todayStr = `${get("year")}-${get("month")}-${get("day")}`;
  const weekday = get("weekday");
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: `Hoje é ${todayStr} (${weekday}), fuso America/Sao_Paulo. "Amanhã" = ${todayStr} + 1 dia. Responda APENAS JSON {"date":"YYYY-MM-DD","time":"HH:MM"}. Manhã=09:00, tarde=14:00, noite=18:00. Fallback se incerto: amanhã 10:00.` },
          { role: "user", content: `Data: "${dateText}"\nHora: "${timeText}"` },
        ],
        max_tokens: 80,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const txt = data.choices?.[0]?.message?.content || "";
      const m = txt.match(/\{[\s\S]*\}/);
      if (m) { const p = JSON.parse(m[0]); if (p.date && p.time) return p; }
    }
  } catch (e) { console.error("Date parse error:", e); }
  // Fallback: amanhã em SP
  const [y, m, d] = todayStr.split("-").map(Number);
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
  const fb = `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, "0")}-${String(tomorrow.getUTCDate()).padStart(2, "0")}`;
  return { date: fb, time: "10:00" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json();
    const { messages = [], sellerId, sellerName, prelinkedItem, botId } = body as {
      messages: any[]; sellerId: string; sellerName?: string;
      prelinkedItem?: { id: string; title: string; category?: string; neighborhood?: string; address?: string; city?: string; bedrooms?: number; price?: number };
      botId?: string;
    };

    if (!sellerId) {
      return new Response(JSON.stringify({ error: "sellerId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const isPrelinked = !!prelinkedItem?.id;

    // Saudação inicial
    if (messages.length === 0) {
      const tag = sellerName ? ` à ${sellerName}` : "";
      let greeting: string;
      if (isPrelinked) {
        const propInfo = `${prelinkedItem!.title}${prelinkedItem!.neighborhood ? ` — ${prelinkedItem!.neighborhood}` : ""}${prelinkedItem!.city ? `, ${prelinkedItem!.city}` : ""}`;
        greeting = `Olá! 👋 Bem-vindo(a)${tag}!\n\nVi que você se interessou pelo imóvel **${propInfo}**. 🏡 Vou te ajudar a agendar uma visita rapidinho.\n\nPara começar, qual o seu nome completo?`;
      } else {
        greeting = `Olá! 👋 Seja bem-vindo(a)${tag}! Vou te ajudar a agendar uma visita ao imóvel. 📅\n\nQual imóvel você gostaria de visitar? Pode me dizer o código, endereço ou descrever (bairro, tipo, quartos).`;
      }
      return new Response(JSON.stringify({ reply: greeting, savedVisit: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let systemPrompt: string;
    let tool: any;
    if (isPrelinked) {
      const propInfo = `(título: "${prelinkedItem!.title}"${prelinkedItem!.neighborhood ? `, bairro: ${prelinkedItem!.neighborhood}` : ""}${prelinkedItem!.city ? `, cidade: ${prelinkedItem!.city}` : ""}${prelinkedItem!.bedrooms ? `, ${prelinkedItem!.bedrooms} quartos` : ""})`;
      systemPrompt = SYSTEM_PROMPT_PRELINKED.replace("{{PROPERTY_INFO}}", propInfo);
      tool = SAVE_VISIT_TOOL_PRELINKED;
    } else {
      systemPrompt = SYSTEM_PROMPT_OPEN;
      tool = SAVE_VISIT_TOOL_OPEN;
    }
    if (sellerName) systemPrompt += `\n\nVocê representa "${sellerName}".`;

    const { data: sellerProfile } = await supabase.from("profiles").select("user_id").eq("id", sellerId).maybeSingle();
    const sellerUserId = sellerProfile?.user_id as string | undefined;
    if (!sellerUserId) {
      return new Response(JSON.stringify({ error: "Loja não encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const visitorIp = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "unknown";
    const visitorKey = `${visitorIp}:${sellerId}`;
    const credit = await consumeAiCreditsForUser(supabase, sellerUserId, sellerId, "agenda_bot_chat", corsHeaders, visitorKey);
    if (!credit.ok) return credit.response;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 350,
        tools: [tool],
      }),
    });

    if (!aiResp.ok) {
      await refundAiCredits(credit.admin, credit.userId, credit.sellerId, credit.cost, "agenda_bot_chat");
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas mensagens. Aguarde." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      console.error("AI gateway error:", aiResp.status, await aiResp.text());
      return new Response(JSON.stringify({ error: "Erro IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

            // Resolve imóvel
            let item_id: string | null = null;
            let confidence = 0;
            let guess = "";
            let propertyType: string | null = null;
            let propertyCode: string | null = null;
            let address: string | null = null;
            let city: string | null = null;

            if (isPrelinked) {
              item_id = prelinkedItem!.id;
              confidence = 1;
              guess = prelinkedItem!.title;
              const { data: itm } = await supabase.from("seller_items").select("category, address, city, slug").eq("id", item_id).maybeSingle();
              if (itm) { propertyType = itm.category; propertyCode = itm.slug; address = itm.address; city = itm.city; }
            } else {
              const match = await matchProperty(supabase, sellerId, args.property_query, apiKey);
              item_id = match.item_id; confidence = match.confidence; guess = match.guess;
              if (item_id) {
                const { data: itm } = await supabase.from("seller_items").select("category, address, city, slug").eq("id", item_id).maybeSingle();
                if (itm) { propertyType = itm.category; propertyCode = itm.slug; address = itm.address; city = itm.city; }
              } else {
                address = args.property_query?.slice(0, 200) || null;
              }
            }

            const dt = await parseDateTime(args.visit_date_text, args.visit_time_text, apiKey);

            const { data: profile } = await supabase.from("profiles").select("user_id, city").eq("id", sellerId).maybeSingle();
            if (!profile) throw new Error("Loja não encontrada");
            if (!city) city = profile.city;

            // ===== Verificação de conflito de horário =====
            let minInterval = 60;
            if (botId) {
              const { data: botCfg } = await supabase.from("agenda_bots").select("min_interval_minutes").eq("id", botId).maybeSingle();
              if (botCfg?.min_interval_minutes != null) minInterval = botCfg.min_interval_minutes;
            }

            if (item_id && minInterval > 0) {
              const { data: existing } = await supabase
                .from("visit_appointments")
                .select("visit_date, visit_time, status")
                .eq("item_id", item_id)
                .eq("visit_date", dt.date)
                .neq("status", "cancelada");

              if (existing && existing.length > 0) {
                const [nh, nm] = dt.time.split(":").map(Number);
                const newMin = nh * 60 + nm;
                const conflict = existing.find((v: any) => {
                  const [eh, em] = (v.visit_time || "00:00").split(":").map(Number);
                  return Math.abs((eh * 60 + em) - newMin) < minInterval;
                });
                if (conflict) {
                  const conflictTime = (conflict.visit_time || "").slice(0, 5);
                  reply = `Ops! 😕 Já tem uma visita marcada para esse imóvel às ${conflictTime} no dia ${new Date(dt.date + "T00:00:00").toLocaleDateString("pt-BR")}. Preciso de pelo menos ${minInterval} minutos de diferença. Pode escolher outro horário? 🙏`;
                  break;
                }
              }
            }

            const noteSrc = isPrelinked
              ? `Agendamento via bot (pré-vinculado).${botId ? ` Bot ID: ${botId}.` : ""}`
              : `Agendamento via bot. Pedido: "${args.property_query}"`;

            const { data: visit, error: visitErr } = await supabase
              .from("visit_appointments")
              .insert({
                user_id: profile.user_id,
                seller_id: sellerId,
                client_name: (args.client_name || "").slice(0, 100),
                client_phone: (args.client_phone || "").slice(0, 30),
                visit_date: dt.date,
                visit_time: dt.time,
                item_id,
                property_type: propertyType,
                property_code: propertyCode,
                address,
                city,
                status: "pendente_confirmacao",
                source: "bot",
                ai_match_confidence: confidence,
                ai_property_guess: guess,
                notes: args.notes ? `${args.notes}\n\n${noteSrc}` : noteSrc,
              })
              .select().single();

            if (visitErr) { console.error("Insert visit error:", visitErr); throw visitErr; }
            savedVisit = visit;

            if (!reply) {
              reply = `Perfeito, ${args.client_name?.split(" ")[0] || ""}! ✅ Sua visita foi registrada para ${new Date(dt.date + "T00:00:00").toLocaleDateString("pt-BR")} às ${dt.time}. O corretor vai confirmar pelo WhatsApp em instantes! 🏡`;
            }
          } catch (e) {
            console.error("save_visit error:", e);
            if (!reply) reply = "Ops! Tive um problema ao registrar. Pode confirmar os dados?";
          }
        }
      }
    }

    if (!reply) reply = "Desculpe, pode repetir?";
    return new Response(JSON.stringify({ reply, savedVisit }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("agenda-bot-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
