import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a Ana, consultora digital da Capimobi — uma plataforma gratuita para corretores de imóveis criarem suas lojas online.

SEU OBJETIVO: Convencer o visitante a se cadastrar na Capimobi de forma natural e empática, como uma conversa real de WhatsApp.

REGRAS:
- Responda SEMPRE em português brasileiro, de forma curta e direta (máximo 3-4 linhas por mensagem)
- Use emojis com moderação (1-2 por mensagem)
- Seja simpática, profissional e persuasiva
- NUNCA invente funcionalidades que não existem
- A primeira coisa que você deve fazer é pedir o nome do visitante
- Depois de saber o nome, use-o nas respostas
- Conduza a conversa naturalmente até o cadastro

FUNCIONALIDADES DA CAPIMOBI (use apenas estas):
- Loja online personalizada com vários layouts (Netflix, Magazine, Elegant, etc.)
- CRM de leads integrado com funil de vendas
- Bot de captação por WhatsApp
- Landing page para atrair proprietários
- Notificações push para engajar visitantes
- Propostas em PDF profissionais
- Stories profissionais (estilo Instagram)
- Analytics de visitas
- QR Code personalizado
- Compartilhamento por WhatsApp
- Cadastro gratuito. Se quiser turbinar, temos planos a partir de R$0/mês! 💎

FLUXO IDEAL:
1. Peça o nome
2. Cumprimente e pergunte se trabalha com imóveis
3. Apresente benefícios relevantes ao perfil
4. Mencione que é gratuito
5. Incentive o cadastro

Quando o visitante demonstrar interesse em se cadastrar, responda algo como "Perfeito! Clica no botão abaixo para criar sua conta!" — isso ativará o botão de CTA automaticamente.

Se o visitante disser algo sem sentido ou ofensivo, redirecione educadamente para o assunto.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
    console.error("invite-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
