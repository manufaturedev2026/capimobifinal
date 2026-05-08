import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { consumeAiCreditsForUser, refundAiCredits } from "../_shared/ai-credits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_BASE = `Você é uma ATENDENTE COMERCIAL PREMIUM de uma loja imobiliária no Brasil. Aja como uma humana real: simpática, calorosa, objetiva e nunca robótica.

REGRAS GLOBAIS:
- Responda SEMPRE em português brasileiro, curto (máx. 3-4 linhas).
- Use 1-2 emojis estratégicos por mensagem.
- Uma pergunta por vez.
- Logo no início, peça o NOME do visitante e use o nome nas respostas seguintes.
- Se o visitante perguntar sobre imóveis específicos, valor ou disponibilidade, diga que vai conectar com o corretor humano após coletar nome e WhatsApp.
- Se o visitante for ofensivo, redirecione educadamente.

OBJETIVO: Qualificar o lead coletando NOME, WHATSAPP, INTENÇÃO (compra/aluguel/venda), e detalhes do imóvel desejado (cidade/bairro, faixa de valor, tipo). Assim que tiver pelo menos NOME + TELEFONE, chame a ferramenta save_lead.`;

const SYSTEM_BASE_VALUES = `

INTERPRETAÇÃO DE VALORES (MUITO IMPORTANTE):
- Estamos no Brasil (R$). Interprete os números do jeito que um brasileiro fala.
- Para ALUGUEL, valores típicos ficam entre R$ 500 e R$ 15.000/mês. Se o visitante disser "1600", "2 mil", "3500", entenda como reais por mês (R$ 1.600, R$ 2.000, R$ 3.500). NUNCA multiplique por 100 nem confunda com 160.000.
- Para COMPRA/VENDA, "300" geralmente significa R$ 300 mil; "1,2" ou "1.2" significa R$ 1,2 milhão. Use o contexto.
- "k" = mil, "mi" / "milhão" = milhão. Ex.: "2k" = R$ 2.000, "1,5mi" = R$ 1.500.000.
- Se houver QUALQUER ambiguidade no valor, CONFIRME com o visitante antes de registrar (ex.: "Só pra confirmar: R$ 1.600 por mês, certo? 😊").
- Ao salvar em desired_price, escreva sempre formatado em reais com a unidade clara (ex.: "R$ 1.600/mês" para aluguel, "R$ 450.000" para compra).`;

const EXTRACT_TOOL = {
  type: "function",
  function: {
    name: "save_lead",
    description:
      "Salva os dados do lead quando nome e telefone foram coletados. Chame assim que tiver pelo menos nome e telefone.",
    parameters: {
      type: "object",
      properties: {
        full_name: { type: "string" },
        phone: { type: "string" },
        property_type: { type: "string" },
        address: { type: "string", description: "Cidade/bairro de interesse" },
        desired_price: { type: "string" },
        notes: { type: "string", description: "Resumo da conversa e observações" },
        finality: { type: "string", enum: ["compra", "aluguel", "venda", "outro"] },
      },
      required: ["full_name", "phone"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, sellerId, corretorSlug } = body as {
      messages: Array<{ role: string; content: string }>;
      sellerId: string;
      corretorSlug?: string | null;
    };

    if (!sellerId || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Parâmetros inválidos." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: sellerProfile } = await admin
      .from("profiles")
      .select("user_id, full_name, company_name, whatsapp_mode, whatsapp_ai_name, whatsapp_ai_welcome, whatsapp_ai_prompt")
      .eq("id", sellerId)
      .maybeSingle();

    if (!sellerProfile) {
      return new Response(JSON.stringify({ error: "Loja não encontrada." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownerUserId = sellerProfile.user_id as string;
    const sellerName = (sellerProfile as any).company_name || (sellerProfile as any).full_name || "nossa loja";
    const attendantName = ((sellerProfile as any).whatsapp_ai_name || "Sofia").toString().slice(0, 60);
    const customPrompt = ((sellerProfile as any).whatsapp_ai_prompt || "").toString().slice(0, 2000);
    const welcome = ((sellerProfile as any).whatsapp_ai_welcome || "").toString().slice(0, 500);

    // Resolve who pays for the AI session.
    // - Mirror store (manual broker, no linked profile or origin != 'partner'): agency owner pays.
    // - Partner store (origin = 'partner' with linked_profile_id): the broker pays from their own wallet,
    //   and the transaction is logged on the broker's account.
    let payerUserId = ownerUserId;
    let payerSellerId: string | null = sellerId;
    let payerNote = `Atendente IA WhatsApp da loja ${sellerName}`;
    if (corretorSlug && typeof corretorSlug === "string") {
      const { data: member } = await admin
        .from("team_members")
        .select("id, origin, linked_profile_id, full_name")
        .eq("company_id", sellerId)
        .eq("slug", corretorSlug)
        .eq("is_active", true)
        .maybeSingle();
      const m: any = member;
      if (m?.origin === "partner" && m?.linked_profile_id) {
        const { data: brokerProfile } = await admin
          .from("profiles")
          .select("id, user_id")
          .eq("id", m.linked_profile_id)
          .maybeSingle();
        if (brokerProfile?.user_id) {
          payerUserId = brokerProfile.user_id as string;
          payerSellerId = (brokerProfile as any).id as string;
          payerNote = `Atendente IA WhatsApp via loja parceira de ${sellerName}`;
        }
      }
    }

    // Greeting (no charge, no AI call)
    if (messages.length === 0) {
      const reply =
        welcome.trim() ||
        `Olá 👋 Eu sou a ${attendantName}, atendente virtual da ${sellerName}! Como posso te ajudar hoje? Pode começar me dizendo seu nome 😊`;
      return new Response(JSON.stringify({ reply, extractedData: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Charge once per visitor session window
    const visitorIp =
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const visitorKey = `${visitorIp}:${sellerId}:${corretorSlug || "_"}`;
    const credit = await consumeAiCreditsForUser(
      admin,
      payerUserId,
      payerSellerId,
      "whatsapp_ai_chat",
      corsHeaders,
      visitorKey,
    );
    if (!credit.ok) return credit.response;

    let systemPrompt = `${SYSTEM_BASE}\n\nVocê está representando "${sellerName}". Seu nome de atendimento é "${attendantName}" — use exatamente esse nome quando se apresentar.`;
    if (customPrompt.trim()) {
      systemPrompt += `\n\nINSTRUÇÕES PERSONALIZADAS DO CORRETOR (siga sempre que não conflitarem com segurança/leis):\n${customPrompt.trim()}`;
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 400,
        tools: [EXTRACT_TOOL],
      }),
    });

    if (!aiResp.ok) {
      await refundAiCredits(credit.admin, credit.userId, credit.sellerId, credit.cost, "whatsapp_ai_chat");
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas mensagens, tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Atendimento por IA temporariamente indisponível." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const choice = data.choices?.[0];
    let reply: string = choice?.message?.content || "";
    let extractedData: any = null;
    const toolCalls = choice?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      for (const tc of toolCalls) {
        if (tc.function?.name === "save_lead") {
          try {
            extractedData = JSON.parse(tc.function.arguments);
          } catch (e) {
            console.error("parse tool args error", e);
          }
        }
      }
    }

    if (extractedData && !reply) {
      reply = `Perfeito, ${extractedData.full_name || ""}! ✅ Já anotei tudo. Vou te conectar agora com o corretor pelo WhatsApp! 🚀`;
    }
    if (!reply && !extractedData) {
      reply = "Desculpe, não consegui entender. Pode repetir? 😊";
    }

    return new Response(
      JSON.stringify({
        reply,
        extractedData,
        aiCredits: { charged: credit.cost, balance: credit.balance },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("whatsapp-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});