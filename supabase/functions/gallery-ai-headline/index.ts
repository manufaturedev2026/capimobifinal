import { consumeAiCredits, refundAiCredits } from "../_shared/ai-credits.ts";

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
    const credit = await consumeAiCredits(req, "gallery_ai_headline" as any, corsHeaders);
    if (!credit.ok) return credit.response;

    const userPrompt = `Você é um copywriter imobiliário premium. Crie UMA headline de marketing curta, impactante e persuasiva (MÁX 8 palavras, sem ponto final) para a peça de Instagram/Stories deste imóvel. NÃO use o título original cru. Use linguagem aspiracional, gatilhos emocionais, emojis quando fizer sentido.

DADOS DO IMÓVEL:
- Título original: ${data.title || "—"}
- Categoria: ${data.category || "—"}
- Cidade/Bairro: ${data.location || "—"}
- Preço: ${data.price ? `R$ ${data.price}` : "—"}
- Quartos: ${data.bedrooms || "—"} | Banheiros: ${data.bathrooms || "—"} | Vagas: ${data.parking || "—"} | Área: ${data.area ? data.area + "m²" : "—"}
- Operação: ${data.operation || "venda"}

EXEMPLOS DE BOAS HEADLINES:
- "Seu novo lar te espera ✨"
- "Cobertura dos sonhos em Vitória"
- "Conforto + Localização premium 🏡"
- "Apartamento perfeito pra família"
- "Investimento certeiro 📈"

Retorne APENAS via tool call, com a headline pronta.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "return_headline",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string", description: "Headline curta e impactante (máx 8 palavras)" },
              },
              required: ["headline"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_headline" } },
      }),
    });

    if (!response.ok) {
      await refundAiCredits(credit.admin, credit.userId, credit.sellerId, credit.cost, "gallery_ai_headline");
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite atingido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos do gateway esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }
    const result = await response.json();
    const tc = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) throw new Error("No headline returned");
    return new Response(tc.function.arguments, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
