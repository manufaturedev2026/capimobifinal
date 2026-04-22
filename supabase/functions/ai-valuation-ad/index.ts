import { consumeAiCredits, refundAiCredits } from "../_shared/ai-credits.ts";

// Gera texto pronto para anúncio a partir de uma avaliação
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const data = await req.json();
    const credit = await consumeAiCredits(req, "valuation_ad", corsHeaders);
    if (!credit.ok) return credit.response;
    const userPrompt = `Crie um anúncio profissional, persuasivo e curto para este imóvel (estilo OLX/Imovelweb).

Localização: ${data.bairro}, ${data.cidade}/${data.estado}
Tipo: ${data.tipo}
Área: ${data.areaConstruida || data.areaTotal}m²
Quartos: ${data.quartos ?? 0} (${data.suites ?? 0} suítes) | Banheiros: ${data.banheiros ?? 0} | Vagas: ${data.garagem ?? 0}
Extras: ${data.extras?.join(", ") || "—"}
Acabamento: ${data.acabamento} | Conservação: ${data.conservacao}
Valor sugerido: R$ ${data.valor_estimado?.toLocaleString("pt-BR")}

Retorne via tool: titulo (até 80 chars, atrativo) e descricao (3-5 parágrafos vendedores, com emoji e CTA). Em português brasileiro.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "return_ad",
            parameters: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                descricao: { type: "string" },
              },
              required: ["titulo", "descricao"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_ad" } },
      }),
    });

    if (!response.ok) {
      await refundAiCredits(credit.admin, credit.userId, credit.sellerId, credit.cost, "valuation_ad");
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite atingido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }
    const result = await response.json();
    const tc = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) throw new Error("No ad returned");
    return new Response(tc.function.arguments, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
