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
- **Planos**: Básico (grátis, 5 imóveis), Start (R$24,99, 25 imóveis), VIP (R$59,99, 60 imóveis), Premium (R$114,99, 115 imóveis), Exclusive/Prime/Black (empresa, ilimitado)
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
