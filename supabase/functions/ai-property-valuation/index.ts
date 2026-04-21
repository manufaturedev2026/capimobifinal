const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const data = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `Você é um avaliador imobiliário sênior brasileiro com 20 anos de experiência. 
Avalie o imóvel com base em dados de mercado realistas para a localização informada (use seu conhecimento sobre a região).
Considere: localização, tipo, área, estrutura, extras, padrão de acabamento e estado de conservação.
Retorne SEMPRE valores em Reais (R$) condizentes com o mercado real da cidade/bairro informado.`;

    const userPrompt = `Avalie este imóvel:

📍 Localização: ${data.bairro}, ${data.cidade} - ${data.estado}${data.rua ? ` (${data.rua})` : ""}
🏠 Tipo: ${data.tipo}
📐 Área total: ${data.areaTotal}m² | Construída: ${data.areaConstruida || "-"}m²
🛏️ ${data.quartos} quartos (${data.suites} suítes) | 🚿 ${data.banheiros} banheiros | 🚗 ${data.garagem} vagas
✨ Extras: ${data.extras?.join(", ") || "nenhum"}
🎨 Acabamento: ${data.acabamento}
🔧 Estado: ${data.estado_conservacao}

Retorne uma avaliação completa com valores realistas para esta região.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_valuation",
              description: "Retorna avaliação imobiliária estruturada",
              parameters: {
                type: "object",
                properties: {
                  valor_estimado: { type: "number", description: "Valor estimado de mercado em R$" },
                  faixa_min: { type: "number", description: "Faixa mínima ideal em R$" },
                  faixa_max: { type: "number", description: "Faixa máxima ideal em R$" },
                  venda_rapida: { type: "number", description: "Preço para venda rápida em R$" },
                  venda_premium: { type: "number", description: "Preço premium para vendedor paciente em R$" },
                  potencial_valorizacao_pct: { type: "number", description: "Potencial de valorização anual em %" },
                  tempo_medio_venda_dias: { type: "number", description: "Tempo médio estimado para venda em dias" },
                  justificativa: { type: "string", description: "Justificativa técnica detalhada da avaliação (3-5 parágrafos)" },
                  pontos_fortes: { type: "array", items: { type: "string" }, description: "3-5 pontos fortes do imóvel" },
                  pontos_atencao: { type: "array", items: { type: "string" }, description: "2-4 pontos de atenção" },
                },
                required: ["valor_estimado", "faixa_min", "faixa_max", "venda_rapida", "venda_premium", "potencial_valorizacao_pct", "tempo_medio_venda_dias", "justificativa", "pontos_fortes", "pontos_atencao"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_valuation" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No valuation returned");
    const valuation = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(valuation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("valuation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
