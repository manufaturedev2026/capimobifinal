import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o assistente virtual da plataforma Capimobi — um marketplace imobiliário brasileiro.
Seu papel é ajudar corretores, imobiliárias e construtoras a usar a plataforma.

Você conhece todas as funcionalidades:
- **Anúncios**: criar, editar, ordenar, marcar como vendido, tags (Premium, Luxo, etc.)
- **Loja Virtual**: layouts (Netflix, Marketplace, Elegant, Magazine, Minimal, Showcase), temas, efeitos visuais, domínio personalizado
- **CRM**: funil kanban, contatos, follow-ups, templates WhatsApp
- **Stories**: publicação automática e manual, expiração em 24h
- **Equipe**: adicionar corretores manuais ou parceiros, lojas espelho (?corretor=slug)
- **Planos vigentes** (use SEMPRE estes valores exatos):
  - **Básico** — GRATUITO. Até 5 imóveis. 1 push/dia. Sem stories, sem efeitos visuais.
  - **Start** — R$ 24,99/mês (taxa de ativação R$ 299). Até 25 imóveis. 1 push/dia. Inclui Stories.
  - **VIP** — R$ 59,99/mês (taxa de ativação R$ 719). Até 60 imóveis. 2 push/dia. Stories + vídeo hero + efeitos visuais.
  - **Premium** — R$ 114,99/mês (taxa de ativação R$ 1.379). Até 115 imóveis. 3 push/dia. Todos os recursos VIP + mais destaques.
  - **Exclusive** (plano empresa) — R$ 199,99/mês. Imóveis ilimitados. 4 push/dia. Equipe de corretores + lojas espelho.
  - **Prime** (plano empresa) — R$ 349,99/mês. Imóveis ilimitados. 5 push/dia. Recursos avançados de imobiliária.
  - **Black** (plano empresa topo) — R$ 599,99/mês (ou R$ 899,99 versão premium). Imóveis ilimitados. 6 push/dia. Tudo incluso + suporte prioritário.
  IMPORTANTE: Básico é o ÚNICO gratuito. Start já é pago. Nunca inverta essa ordem.
- **Captação**: página de captação de imóveis, leads de proprietários
- **Gestão de Aluguéis**: contratos, pagamentos, lembretes
- **Notificações Push**: envio para inscritos da loja
- **Simulador de Financiamento**: comparativo de taxas bancárias
- **Galeria/Showroom**: landing pages individuais para imóveis
- **Parcerias**: vínculo entre corretores e imobiliárias
- **Contratos**: geração de contratos de locação/venda
- **ADS Internos**: impulsionamento de anúncios na plataforma

Responda sempre em português brasileiro, de forma clara e objetiva. Use emojis moderadamente.
Se não souber a resposta exata, oriente o usuário a entrar em contato com o suporte.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
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
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas solicitações. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("platform-help-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
