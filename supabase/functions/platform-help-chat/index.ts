import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { consumeAiCredits } from "../_shared/ai-credits.ts";

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
- **Planos vigentes** (pagamentos ÚNICOS via Stripe — NÃO são assinaturas recorrentes; mensais valem 30 dias, anuais 365 dias):
  **Corretor(a):**
  - **Básico** — GRATUITO. Até 5 imóveis.
  - **Start** — R$ 29,90 (mensal). Mais imóveis e recursos.
  - **Premium** — R$ 59,90 (mensal). Recursos avançados.
  - **Prime** — R$ 119,90 (mensal). Topo da categoria corretor.
  **Imobiliária:**
  - **Grátis** — Plano inicial.
  - **Start** — R$ 119,90 (mensal).
  - **Pro** — R$ 239,90 (mensal).
  - **Elite** — R$ 479,90 (mensal). Topo imobiliária.
  **Construtora:**
  - **Grátis** — Plano inicial.
  - **Start** — R$ 179,90 (mensal).
  - **Pro** — R$ 359,90 (mensal).
  - **Master** — R$ 779,90 (mensal). Topo construtora.

  **Modalidades de cobrança (todos os planos pagos):**
  - **Mensal**: pagamento único válido por 30 dias (preços listados acima).
  - **Anual**: pagamento único válido por 365 dias com desconto padrão de 20% (configurável pelo admin via `annual_discount_percent`). Cálculo: preço mensal × 12 × (1 − desconto). Ex: Premium Anual ≈ R$ 574,80/ano (12 × 59,90 × 0,80) cobrado de uma vez.
  - Cupons de desconto podem ser aplicados sobre Mensal ou Anual (cumulativos com o desconto anual quando configurados como `forever`).
  - Créditos de IA: Mensal recarrega todo mês; Anual entrega 12 meses de créditos de uma vez na compra.

  **Plano Fundador** (oportunidade limitada por lotes — quando o lote esgota o preço sobe no próximo):
  - **Fundador Corretor** — Lote 1: R$ 719,40 (pagamento único). Válido 12 meses. ~1.000 créditos de IA/mês. Inclui benefícios do plano Prime.
  - **Fundador Empresa (Imobiliária)** — Lote 1: R$ 2.879,40 (pagamento único). Válido 12 meses. ~3.500 créditos de IA/mês. Inclui benefícios do plano Imob Elite.
  - **Fundador Construtora** — Lote 1: R$ 4.679,40 (pagamento único). Válido 12 meses. ~60.000 créditos de IA/mês. Inclui benefícios do plano Construtora Master.
  IMPORTANTE: Fundador é pagamento ÚNICO válido por 12 meses (NÃO é vitalício e NÃO custa R$ 97). Os preços e créditos são definidos por lote no admin e podem variar. Sempre confirme valores atuais na página /fundador.
  IMPORTANTE: Não existem mais "VIP", "Exclusive", "Black" nem taxas de ativação. Todos os planos são pagamento único (não renovam automaticamente). Há opção Mensal e Anual com cupons de desconto aplicáveis.
- **Captação**: página de captação de imóveis, leads de proprietários
- **Gestão de Aluguéis**: contratos, pagamentos, lembretes
- **Notificações Push**: envio para inscritos da loja
- **Simulador de Financiamento**: comparativo de taxas bancárias
- **Galeria/Showroom**: landing pages individuais para imóveis
- **Parcerias**: vínculo entre corretores e imobiliárias
- **Contratos**: geração de contratos de locação/venda
- **ADS Internos**: impulsionamento de anúncios na plataforma

Categorias de cadastro disponíveis: Corretor(a), Imobiliária, Construtora. (Proprietário foi removido.)
Rotas principais: /anunciar (cadastro), /seja-corretor (recrutamento), /login, /admin (apenas administradores), /imoveis/:cidade (busca por cidade), /empresa/:slug (loja pública), /captar-imovel/:slug (captação).

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

    const credit = await consumeAiCredits(req, "platform_help_chat", corsHeaders);
    if (!credit.ok) return credit.response;

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
