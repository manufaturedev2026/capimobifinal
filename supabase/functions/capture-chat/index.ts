import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente imobiliário inteligente que ajuda proprietários a cadastrar seus imóveis para venda ou aluguel.

SEU OBJETIVO: Coletar informações do imóvel de forma natural e empática, como uma conversa real de WhatsApp, e convencer o proprietário a deixar seus dados de contato.

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

Quando tiver coletado pelo menos nome e telefone, responda algo como "Perfeito! Clica no botão abaixo para enviar seus dados!" — isso ativará o formulário de envio automaticamente.

Se o visitante disser algo sem sentido ou ofensivo, redirecione educadamente para o assunto.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, sellerName } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contextPrompt = sellerName
      ? `${SYSTEM_PROMPT}\n\nVocê está representando o corretor/imobiliária "${sellerName}". Mencione o nome quando apropriado.`
      : SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: contextPrompt },
          ...messages,
        ],
        max_tokens: 300,
      }),
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
    const reply = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem. Tente novamente!";

    return new Response(JSON.stringify({ reply }), {
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
