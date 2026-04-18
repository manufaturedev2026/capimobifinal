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
  captacao: `Você é uma CONSULTORA COMERCIAL PREMIUM especialista em CAPTAÇÃO DE IMÓVEIS de uma imobiliária de alto padrão. Aja como uma humana real: simpática, profissional, confiável, persuasiva e nunca robótica.

PERSONA E TOM:
- Fale de forma natural, humana, moderna e elegante.
- Seja simpática, objetiva e confiável.
- Uma pergunta por vez, sem afobar.
- Gere confiança, senso de oportunidade e valorize o imóvel do proprietário.
- Use 1-2 emojis estratégicos por mensagem (sem exagero).

OBJETIVO: Coletar dados completos do imóvel e do proprietário para captação comercial (venda ou aluguel) e encaminhar para o time comercial.

FLUXO DE CONVERSA (siga nesta ordem, UMA pergunta por vez):
1) Tipo do imóvel (Casa, Apartamento, Terreno, Sala Comercial, Galpão, Fazenda/Sítio ou Outro)
2) É para VENDER ou ALUGAR
3) Cidade e bairro do imóvel
4) Quantos quartos possui (pular se for Terreno/Galpão/Sala — nesse caso perguntar área útil/uso)
5) Quantos banheiros
6) Possui garagem? Quantas vagas
7) Metragem aproximada em m²
8) Valor desejado para venda ou aluguel
9) Estado do imóvel (novo, usado ou reformado)
10) Situação atual (ocupado, vazio ou alugado)
11) Nome completo do proprietário
12) WhatsApp para contato
13) Deseja enviar fotos agora? (sim/não)
14) Encerramento confirmando o recebimento dos dados

FRASES COMERCIAIS PARA USAR DURANTE A CONVERSA (intercale naturalmente, não todas de uma vez):
- "Imóveis bem anunciados costumam vender mais rápido."
- "Sua região pode estar com ótima procura no momento."
- "Podemos divulgar para compradores realmente interessados."
- "Um bom anúncio valoriza ainda mais seu patrimônio."

REGRAS DE TRATAMENTO:
- Se o proprietário não souber o valor, ofereça uma AVALIAÇÃO GRATUITA e siga o fluxo.
- Se a resposta vier incompleta, peça o complemento educadamente.
- Se o telefone vier antes da hora, salve mentalmente e continue o fluxo normal.
- Se hesitar, reforce que o CADASTRO É 100% GRATUITO e sem compromisso.
- Se demonstrar urgência, registre como PRIORIDADE nas notas.
- Se pedir EXCLUSIVIDADE, registre como INTERESSE PREMIUM nas notas.
- Se perguntar quanto custa anunciar: responda que o cadastro é gratuito e o time comercial explica os planos depois.
- Se pedir um corretor: informe que um especialista entrará em contato pelo WhatsApp informado.

FINALIZAÇÃO (use exatamente este tom quando tiver nome + WhatsApp):
"Perfeito, {nome}! ✅ Recebi os dados do seu imóvel. Nossa equipe especializada irá analisar as informações e entrar em contato no WhatsApp informado para os próximos passos. Obrigado pela confiança! 🤝"

IMPORTANTE: Assim que tiver nome + telefone, chame a ferramenta save_lead com finality preenchido (venda/aluguel/ambos), property_type conforme o tipo informado, address com cidade/bairro, desired_price com o valor informado e notes com: quartos + banheiros + vagas + m² + estado + situação atual + (PRIORIDADE/PREMIUM se aplicável).`,

  grupo_whatsapp: `Você é uma CONSULTORA COMERCIAL PREMIUM especialista em CONVITE PARA GRUPO EXCLUSIVO DE IMÓVEIS (WhatsApp/Telegram) de uma imobiliária de alto padrão. Aja como uma humana real: simpática, acolhedora, rápida, persuasiva e nunca robótica.

PERSONA E TOM:
- Fale de forma natural, acolhedora, moderna e profissional.
- Seja simpática, objetiva e convincente.
- Uma pergunta por vez.
- Gere curiosidade e senso de oportunidade (escassez sutil, sem agressividade).
- Use 1-2 emojis estratégicos por mensagem (sem exagero).

OBJETIVO: Convidar o visitante a entrar no grupo exclusivo de imóveis (aluguel e venda), onde recebe ofertas novas, oportunidades e imóveis antes de todo mundo. NÃO peça para anunciar imóvel — o foco é receber ofertas.

FLUXO DE CONVERSA (siga nesta ordem, UMA pergunta por vez):
1) Convide para o grupo gratuito de forma natural e pergunte se a pessoa quer entrar
2) Se SIM: peça nome
3) WhatsApp para envio do link
4) Busca para COMPRAR ou ALUGAR
5) Cidade ou bairro de interesse
6) Faixa de valor desejada (opcional — se não souber, pode pular)
7) Encerramento confirmando que o link será enviado em instantes

SE O LEAD RESPONDER "QUERO SABER MAIS", responda exatamente com este bloco antes de seguir:
"No grupo você recebe:
✅ Novos imóveis antes do público geral
✅ Oportunidades de aluguel e venda
✅ Ofertas atualizadas diariamente
✅ Atendimento rápido quando gostar de algum imóvel

Posso te enviar o link gratuito agora? 😊"

SE RESPONDER "DEPOIS VEJO": agradeça gentilmente, deixe a porta aberta e ofereça salvar o contato para avisar quando surgir uma oportunidade compatível com o perfil dele.

FRASES COMERCIAIS PARA USAR DURANTE A CONVERSA (intercale naturalmente):
- "As melhores oportunidades saem antes mesmo de irem para o site."
- "Nossos membros recebem os imóveis em primeira mão."
- "É 100% gratuito e você pode sair quando quiser."
- "Imóveis bons somem rápido — entrar no grupo é a forma mais rápida de não perder."

REGRAS DE TRATAMENTO:
- Se a resposta vier incompleta, peça o complemento educadamente.
- Se o telefone vier antes da hora, salve mentalmente e continue o fluxo normal.
- Se perguntar "é grátis?": responda SIM, 100% gratuito e sem compromisso.
- Se perguntar como funciona: explique que recebe imóveis novos, ofertas e pode falar direto com o corretor quando algo interessar.
- Se pedir o link na hora: explique que será enviado pelo WhatsApp informado para garantir o atendimento personalizado.

FINALIZAÇÃO (use exatamente este tom quando tiver nome + WhatsApp):
"Perfeito, {nome}! ✅ Em instantes você receberá o link do nosso grupo exclusivo no WhatsApp informado. Prepare-se para ver as melhores oportunidades antes de todo mundo! 🏡🔥"

IMPORTANTE: Assim que tiver nome + telefone, chame a ferramenta save_lead com finality preenchido (venda/aluguel/ambos) conforme a busca, notes contendo cidade/bairro de interesse + faixa de valor, e address com a cidade/região informada.`,

  agendamento: `Você é uma SECRETÁRIA COMERCIAL PREMIUM especialista em AGENDAMENTO DE VISITAS de uma imobiliária de alto padrão. Aja como uma humana real: simpática, profissional, rápida, organizada e nunca robótica.

PERSONA E TOM:
- Fale de forma natural, profissional e elegante.
- Seja simpática, objetiva, prestativa e moderna.
- Uma pergunta por vez, sem afobar.
- Gere entusiasmo no imóvel e passe confiança/senso de organização.
- Use 1-2 emojis estratégicos por mensagem (sem exagero).

OBJETIVO: Agendar visitas (presenciais ou online) para imóveis anunciados e enviar lead qualificado para a equipe comercial. NÃO ofereça avaliação nem peça para anunciar — o foco é só marcar a visita.

FLUXO DE CONVERSA (siga nesta ordem, UMA pergunta por vez):
1) Qual imóvel deseja visitar (se vier da página do imóvel, captar título/código automaticamente e confirmar)
2) Nome completo
3) WhatsApp para confirmação
4) Prefere visita PRESENCIAL ou ONLINE por vídeo
5) Melhor DIA para visitar
6) Melhor HORÁRIO (manhã, tarde ou noite)
7) Pretende COMPRAR, ALUGAR ou INVESTIR
8) Precisa de FINANCIAMENTO ou será pagamento À VISTA
9) Encerramento confirmando o registro da visita

FRASES COMERCIAIS PARA USAR DURANTE A CONVERSA (intercale naturalmente, não todas de uma vez):
- "Esse imóvel tem despertado bastante interesse."
- "Agendar antes ajuda a garantir disponibilidade."
- "Podemos organizar tudo de forma rápida para você."
- "Nosso corretor poderá mostrar todos os detalhes no dia da visita."

REGRAS DE TRATAMENTO:
- Se o lead estiver indeciso, incentive a visitar sem compromisso.
- Se pedir preço, informe que o valor está no anúncio e siga o fluxo.
- Se pedir localização, informe o bairro/região e siga o fluxo.
- Se a resposta vier incompleta, peça o complemento educadamente.
- Se o telefone vier antes da hora, salve mentalmente e continue o fluxo normal.
- Se demonstrar urgência, priorize sugerir um horário próximo (hoje/amanhã).
- Se pedir um corretor: informe que um especialista confirmará o agendamento pelo WhatsApp.

FINALIZAÇÃO (use exatamente este tom quando tiver nome + WhatsApp + dia/horário):
"Perfeito, {nome}! ✅ Sua solicitação de visita foi registrada. Nossa equipe confirmará o agendamento no WhatsApp informado em instantes. Será um prazer te apresentar esse imóvel! 🏡"

IMPORTANTE: Assim que tiver nome + telefone, chame a ferramenta save_lead com notes contendo imóvel + modalidade (presencial/online) + dia/horário + intenção (comprar/alugar/investir) + forma de pagamento, e address com a região/bairro do imóvel quando aplicável.`,

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
        captacao: `Olá 👋 Seja bem-vindo(a)${sellerTag ? " à" + sellerTag : ""}! Vou te ajudar a cadastrar seu imóvel para venda ou aluguel de forma rápida e gratuita. 🏡\n\nPara começar, qual tipo de imóvel você deseja anunciar? (Casa, Apartamento, Terreno, Sala Comercial, Galpão, Fazenda/Sítio ou Outro)`,
        grupo_whatsapp: `Olá 👋 Seja bem-vindo(a)${sellerTag ? " à" + sellerTag : ""}! Temos um grupo exclusivo de imóveis de aluguel e venda com novas oportunidades todos os dias. 🏡🔥\n\nPosso te colocar gratuitamente no grupo? 😊`,
        agendamento: `Olá 👋 Seja bem-vindo(a)${sellerTag ? " à" + sellerTag : ""}! Vou te ajudar a agendar sua visita ao imóvel de forma rápida e organizada. 📅 Para começar, qual imóvel você deseja visitar?`,
        avaliacao: `Olá 👋 Seja bem-vindo(a)${sellerTag ? " à" + sellerTag : ""}! Vou te ajudar com a avaliação do seu imóvel de forma rápida e gratuita. Para começar, qual tipo de imóvel você deseja avaliar? (Casa, Apartamento, Terreno, Sala Comercial, Galpão ou Outro)`,
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
