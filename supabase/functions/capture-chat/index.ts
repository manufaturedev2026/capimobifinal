import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Limites diários de geração de texto com IA por plano
const AI_GEN_DAILY_LIMITS: Record<string, number> = {
  basico: 5,
  start: 10,
  premium: 20,   // VIP
  vip: 50,       // Premium
  essencial_empresa: 100, // Exclusive
  premium_empresa: 200,   // Prime
  prime_empresa: 400,     // Black
  black: 400,
};

const FLOW_PROMPTS: Record<string, string> = {
  captacao: `Você é um assistente imobiliário que ajuda PROPRIETÁRIOS a cadastrar seus imóveis para venda ou aluguel.
OBJETIVO: Coletar nome, telefone/WhatsApp, tipo do imóvel, localização, valor desejado e finalidade (venda/aluguel).
FLUXO IDEAL: 1) Cumprimente e peça o nome 2) Pergunte se quer vender ou alugar 3) Tipo do imóvel 4) Localização 5) Valor desejado 6) Telefone/WhatsApp 7) Confirme.
BENEFÍCIOS: avaliação gratuita, divulgação online, atendimento personalizado, sem burocracia.`,

  grupo_whatsapp: `Você é um assistente que convida visitantes para entrar em um GRUPO EXCLUSIVO de WhatsApp com as melhores oportunidades de imóveis.
OBJETIVO: Coletar nome e telefone/WhatsApp para liberar o link do grupo. NÃO pergunte sobre imóvel para vender — o foco é receber ofertas.
FLUXO IDEAL: 1) Cumprimente e peça o nome 2) Pergunte que tipo de imóvel procura (casa/apto/terreno/comercial) 3) Em qual cidade/região 4) Faixa de preço aproximada 5) Telefone/WhatsApp para liberar o link do grupo 6) Confirme e diga que o link será enviado.
BENEFÍCIOS: ofertas exclusivas antes de irem ao mercado, alertas em tempo real, lançamentos, conteúdos do mercado imobiliário.`,

  agendamento: `Você é um assistente que ajuda visitantes a AGENDAR UMA VISITA a um imóvel ou uma REUNIÃO com o corretor. NÃO ofereça avaliação nem peça para anunciar — o foco é só marcar dia e horário.
OBJETIVO: Coletar nome, telefone/WhatsApp, qual imóvel/região interessa e o melhor dia/horário para o atendimento.
FLUXO IDEAL: 1) Cumprimente e peça o nome 2) Pergunte qual imóvel ou região quer visitar 3) Pergunte o melhor dia da semana 4) Pergunte o melhor horário (manhã, tarde ou noite) 5) Peça o telefone/WhatsApp para confirmar 6) Confirme dizendo que o corretor entrará em contato para confirmar o agendamento.
BENEFÍCIOS: visita sem compromisso, atendimento exclusivo e personalizado, flexibilidade de horários, confirmação rápida via WhatsApp.`,

  avaliacao: `Você é uma CONSULTORA COMERCIAL ESPECIALISTA em AVALIAÇÃO DE IMÓVEIS — uma "secretária premium" de uma imobiliária de alto padrão. Aja como uma humana real: simpática, profissional, eficiente, persuasiva e nunca robótica.

PERSONA E TOM:
- Fale de forma natural, humana, educada e cordial.
- Linguagem simples, profissional e confiável.
- Seja rápida, objetiva e simpática. Uma pergunta por vez.
- Gere urgência e valor percebido sem soar agressiva.
- Use 1-2 emojis estratégicos por mensagem (sem exagero).

OBJETIVO: Coletar dados do proprietário para solicitar a avaliação gratuita do imóvel e encaminhar para o time comercial. NÃO ofereça anunciar nem vender — o foco é só a avaliação.

FLUXO DE CONVERSA (siga nesta ordem, UMA pergunta por vez):
1) Tipo do imóvel (Casa, Apartamento, Terreno, Sala Comercial, Galpão ou Outro)
2) Cidade e bairro do imóvel
3) Quantos quartos possui (pular se for Terreno/Galpão/Sala — perguntar área útil em vez disso)
4) Metragem aproximada em m²
5) Estado do imóvel (novo, usado ou reformado)
6) Intenção: deseja vender, alugar ou apenas saber o valor
7) Nome do proprietário
8) WhatsApp para receber a avaliação
9) Encerramento confirmando o recebimento dos dados

FRASES COMERCIAIS PARA USAR DURANTE A CONVERSA (intercale naturalmente, não todas de uma vez):
- "Imóveis bem apresentados tendem a valer mais no mercado atual."
- "Sua região pode estar em alta neste momento."
- "Uma avaliação correta evita perder dinheiro na venda."
- "Podemos te passar uma estimativa estratégica, sem compromisso."

REGRAS DE TRATAMENTO:
- Se o lead enrolar ou desviar, responda gentilmente e volte ao fluxo.
- Se a resposta vier incompleta, peça o complemento educadamente.
- Se o telefone vier antes da hora, salve mentalmente e continue o fluxo normal.
- Se perguntar "é grátis?": responda SIM, 100% gratuito e sem compromisso.
- Se perguntar quanto tempo demora: responda que o retorno costuma ser rápido, em poucas horas.
- Se pedir um corretor: informe que um especialista entrará em contato pelo WhatsApp informado.

FINALIZAÇÃO (use exatamente este tom quando tiver nome + WhatsApp):
"Perfeito, {nome}! ✅ Recebi seus dados e nossa equipe especializada irá analisar seu imóvel. Em breve entraremos em contato no WhatsApp informado com uma estimativa estratégica. Obrigado pela confiança! 🤝"

IMPORTANTE: Assim que tiver nome + telefone, chame a ferramenta save_lead com finality preenchido conforme a intenção declarada (venda/aluguel/ambos), notes com tipo + bairro + m² + estado, e address com cidade/bairro.`,
};

const SYSTEM_BASE = `Você é um assistente imobiliário inteligente.

REGRAS GLOBAIS:
- Responda SEMPRE em português brasileiro, curto e direto (máximo 3-4 linhas).
- Use emojis com moderação (1-2 por mensagem).
- Seja simpático, profissional e empático, como uma conversa real de WhatsApp.
- A primeira coisa que você deve fazer é pedir o nome do visitante.
- Depois de saber o nome, use-o nas respostas.
- Se o visitante disser algo sem sentido ou ofensivo, redirecione educadamente.

IMPORTANTE: Quando você tiver coletado pelo menos o NOME e o TELEFONE do visitante, use a ferramenta "save_lead" para salvar os dados, preenchendo "finality" conforme o fluxo abaixo. Continue respondendo naturalmente após salvar.`;

const SYSTEM_PROMPT = `${SYSTEM_BASE}\n\n${FLOW_PROMPTS.captacao}`;

const EXTRACT_TOOL = {
  type: "function",
  function: {
    name: "save_lead",
    description: "Salva os dados do lead quando nome e telefone foram coletados na conversa. Chame assim que tiver pelo menos nome e telefone.",
    parameters: {
      type: "object",
      properties: {
        full_name: { type: "string", description: "Nome completo do visitante" },
        phone: { type: "string", description: "Telefone ou WhatsApp do visitante" },
        property_type: { type: "string", enum: ["casa", "apartamento", "terreno", "comercial", "galpao", "outros"], description: "Tipo do imóvel" },
        address: { type: "string", description: "Endereço ou localização do imóvel" },
        desired_price: { type: "string", description: "Valor desejado pelo proprietário" },
        notes: { type: "string", description: "Observações adicionais sobre o imóvel" },
        finality: { type: "string", enum: ["venda", "aluguel", "ambos"], description: "Se quer vender ou alugar" },
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
    const { action } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── Generate Ad Copy with AI ──
    if (action === "generate_ad_copy") {
      const { sellerName, captureUrl, templateHint } = body;

      // Validar limite diário por plano
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Não autenticado" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const userClient = createClient(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      const user = userData?.user;
      if (!user) {
        return new Response(JSON.stringify({ error: "Sessão inválida" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const admin = createClient(supabaseUrl, supabaseService);

      // Buscar plano vigente
      const { data: subRows } = await admin
        .from("seller_subscriptions")
        .select("tier, seller_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      const tier = (subRows?.[0]?.tier as string) || "basico";
      const sellerId = subRows?.[0]?.seller_id as string | undefined;
      const dailyLimit = AI_GEN_DAILY_LIMITS[tier] ?? 5;

      // Contar gerações nas últimas 24h
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: usedToday } = await admin
        .from("ai_text_generations_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", since);

      if ((usedToday ?? 0) >= dailyLimit) {
        return new Response(JSON.stringify({
          error: `Limite diário atingido (${dailyLimit} gerações/dia no seu plano). Faça upgrade para gerar mais.`,
          limitReached: true,
          used: usedToday,
          limit: dailyLimit,
        }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const adPrompt = `Você é um copywriter especialista em marketing imobiliário brasileiro.

Gere um texto de anúncio criativo e persuasivo para redes sociais (Instagram, Facebook, WhatsApp).

DADOS:
- Nome do corretor/imobiliária: ${sellerName || "Corretor"}
- Link de captação: ${captureUrl || ""}
- Estilo solicitado: ${templateHint || "Captação Geral"}

REGRAS:
- Escreva em português brasileiro
- Use emojis estrategicamente (não exagere)
- Inclua o link de captação
- Inclua hashtags relevantes no final
- Tom profissional mas acessível
- Máximo 300 palavras
- Inclua um CTA (call-to-action) forte
- Mencione benefícios como: avaliação gratuita, divulgação profissional, sem burocracia
- Adapte o tom ao estilo solicitado`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: adPrompt }],
          max_tokens: 800,
        }),
      });

      if (!aiResp.ok) {
        const status = aiResp.status;
        return new Response(JSON.stringify({ error: status === 429 ? "Limite atingido" : "Erro na IA" }), {
          status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResp.json();
      const text = aiData.choices?.[0]?.message?.content || "Erro ao gerar texto.";

      // Registrar uso (best-effort, não bloqueia resposta)
      if (sellerId) {
        await admin.from("ai_text_generations_log").insert({
          user_id: user.id,
          seller_id: sellerId,
          action: "generate_ad_copy",
        });
      }

      return new Response(JSON.stringify({
        text,
        used: (usedToday ?? 0) + 1,
        limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - ((usedToday ?? 0) + 1)),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Chat Mode ──
    const { messages, sellerName, mode, flowType } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const flowKey = (typeof flowType === "string" && FLOW_PROMPTS[flowType]) ? flowType : "captacao";
    const flowSpecific = FLOW_PROMPTS[flowKey];

    // Saudações fixas por fluxo (evita IA improvisar mensagem genérica de captação)
    if (messages.length === 0) {
      const sellerTag = sellerName ? ` ${sellerName}` : "";
      const greetings: Record<string, string> = {
        captacao: `Olá! 👋 Sou o assistente${sellerTag ? " de" + sellerTag : ""}. Vou te ajudar a anunciar seu imóvel para venda ou aluguel. Para começar, qual é o seu nome? 😊`,
        grupo_whatsapp: `Olá! 👋 Sou o assistente${sellerTag ? " de" + sellerTag : ""}. Vou te liberar o acesso ao nosso grupo exclusivo de imóveis no WhatsApp! 🏡🔥 Para começar, qual é o seu nome?`,
        agendamento: `Olá! 👋 Sou o assistente${sellerTag ? " de" + sellerTag : ""}. Vou te ajudar a agendar uma visita ao imóvel ou uma conversa com o corretor. 📅 Para começar, qual é o seu nome?`,
        avaliacao: `Olá! 👋 Sou o assistente${sellerTag ? " de" + sellerTag : ""}. Vou te ajudar a descobrir quanto vale seu imóvel com uma avaliação 100% gratuita, sem compromisso. 💎 Para começar, qual é o seu nome?`,
      };
      return new Response(JSON.stringify({ reply: greetings[flowKey], extractedData: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let contextPrompt = `${SYSTEM_BASE}\n\n${flowSpecific}`;
    if (sellerName) {
      contextPrompt += `\n\nVocê está representando o corretor/imobiliária "${sellerName}". Mencione o nome quando apropriado.`;
    }

    const aiBody: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: contextPrompt },
        ...messages,
      ],
      max_tokens: 400,
      tools: [EXTRACT_TOOL],
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas mensagens. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const reply = choice?.message?.content || "";
    
    // Check for tool calls (structured data extraction)
    let extractedData = null;
    const toolCalls = choice?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      for (const tc of toolCalls) {
        if (tc.function?.name === "save_lead") {
          try {
            extractedData = JSON.parse(tc.function.arguments);
          } catch (e) {
            console.error("Failed to parse tool call args:", e);
          }
        }
      }
    }

    // If we got extracted data but no reply text, generate a confirmation message
    let finalReply = reply;
    if (extractedData && !finalReply) {
      const name = extractedData.full_name || "";
      finalReply = `Perfeito, ${name}! ✅ Recebi todas as suas informações. Clique no botão abaixo para falar diretamente com o corretor pelo WhatsApp — seus dados já estarão preenchidos! 🚀`;
    }

    if (!finalReply && !extractedData) {
      finalReply = "Desculpe, não consegui processar sua mensagem. Tente novamente!";
    }

    return new Response(JSON.stringify({ reply: finalReply, extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("capture-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
