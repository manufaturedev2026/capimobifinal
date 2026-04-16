import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente imobiliário inteligente que ajuda proprietários a cadastrar seus imóveis para venda ou aluguel.

SEU OBJETIVO: Coletar informações do imóvel de forma natural e empática, como uma conversa real de WhatsApp, e ao final gerar os dados estruturados.

REGRAS:
- Responda SEMPRE em português brasileiro, de forma curta e direta (máximo 3-4 linhas por mensagem)
- Use emojis com moderação (1-2 por mensagem)
- Seja simpático, profissional e transmita confiança
- A primeira coisa que você deve fazer é pedir o nome do visitante
- Depois de saber o nome, use-o nas respostas
- Conduza a conversa para coletar: nome, telefone/WhatsApp, tipo do imóvel, localização, valor desejado

INFORMAÇÕES QUE VOCÊ DEVE COLETAR:
1. Nome completo
2. Telefone/WhatsApp
3. Tipo do imóvel (casa, apartamento, terreno, comercial, galpão, etc.)
4. Endereço ou localização aproximada
5. Valor desejado (se tiver)
6. Observações adicionais (opcional)

FLUXO IDEAL:
1. Cumprimente e peça o nome
2. Pergunte se quer vender ou alugar
3. Pergunte o tipo do imóvel
4. Pergunte a localização
5. Pergunte o valor desejado
6. Peça o telefone/WhatsApp para contato
7. Confirme os dados e agradeça

BENEFÍCIOS QUE VOCÊ PODE MENCIONAR:
- Avaliação profissional gratuita do imóvel
- Divulgação em várias plataformas online
- Atendimento personalizado
- Fotos profissionais (quando disponível)
- Estratégia de venda para vender mais rápido
- Sem burocracia

IMPORTANTE: Quando você tiver coletado pelo menos o NOME e o TELEFONE do visitante, use a ferramenta "save_lead" para salvar os dados. Continue respondendo naturalmente após salvar.

Se o visitante disser algo sem sentido ou ofensivo, redirecione educadamente para o assunto.`;

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
      return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Chat Mode ──
    const { messages, sellerName, mode } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contextPrompt = sellerName
      ? `${SYSTEM_PROMPT}\n\nVocê está representando o corretor/imobiliária "${sellerName}". Mencione o nome quando apropriado.`
      : SYSTEM_PROMPT;

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
