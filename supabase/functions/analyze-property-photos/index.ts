// Edge function: analyze-property-photos
// Recebe fotos (data URLs base64) categorizadas e devolve scores visuais + ajuste percentual.
// Não armazena imagens — análise é stateless. Modelo: google/gemini-2.5-pro

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type PhotoIn = { categoria: string; dataUrl: string };

const CATEGORIAS_CONHECIDAS = [
  "fachada","sala","cozinha","banheiro","quarto","quintal",
  "rua","garagem","escada","gourmet","piscina","outro",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const photos = (body?.photos ?? []) as PhotoIn[];
    const contexto = {
      tipo: body?.tipo ?? "Imóvel",
      cidade: body?.cidade ?? "",
      bairro: body?.bairro ?? "",
      acabamentoDeclarado: body?.acabamentoDeclarado ?? "",
      conservacaoDeclarada: body?.conservacaoDeclarada ?? "",
    };

    if (!Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma foto enviada" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limite de segurança: 12 fotos
    const photosLimited = photos.slice(0, 12).filter(
      (p) => typeof p?.dataUrl === "string" && (p.dataUrl.startsWith("data:image/") || p.dataUrl.startsWith("https://") || p.dataUrl.startsWith("http://")),
    );

    const cats = photosLimited.map((p, i) =>
      `Foto ${i + 1} — categoria declarada: "${CATEGORIAS_CONHECIDAS.includes(p.categoria) ? p.categoria : "outro"}"`,
    ).join("\n");

    const systemPrompt = `Você é um avaliador imobiliário sênior, especialista em análise visual de imóveis para fins comparativos de mercado.
Sua função é apenas observar características visíveis nas fotos — NUNCA emitir laudo estrutural de engenharia.
Use sempre linguagem cautelosa: "indícios visuais", "sinais aparentes", "acabamento datado", "conservação acima da média".
NUNCA afirme problemas estruturais definitivos.`;

    const userText = `Analise estas fotos de um ${contexto.tipo} em ${contexto.bairro}, ${contexto.cidade}.
Acabamento declarado pelo proprietário: ${contexto.acabamentoDeclarado || "não informado"}.
Conservação declarada: ${contexto.conservacaoDeclarada || "não informado"}.

${cats}

Para cada foto, identifique o ambiente real (caso a categoria declarada esteja incorreta).
Avalie globalmente o conjunto e devolva via tool call os scores e o ajuste percentual recomendado.

Critérios de pontuação (0 a 10):
- visual_externo: fachada, muro, portão, padrão da vizinhança, rua, topografia
- interior: distribuição, tamanho aparente dos ambientes, modernidade
- acabamento_visual: revestimentos, piso, pintura, esquadrias
- conservacao_aparente: limpeza, sinais de desgaste, organização
- liquidez_visual: apelo comercial, fotogenia, atratividade

Ajuste percentual sobre o valor base (regra estrita):
- Fotos excelentes (acima da média declarada): de +5% até +20%
- Fotos medianas (alinhadas à declaração): 0%
- Fotos ruins (abaixo da declaração ou com sinais de desgaste): de -5% até -25%

Distribuição interna do ajuste (soma = ajuste_total_pct):
- conservacao_visual_pct: até ±8%
- acabamento_visual_pct: até ±6%
- apelo_comercial_pct: até ±4%
- entorno_visual_pct: até ±2%`;

    const content: any[] = [{ type: "text", text: userText }];
    photosLimited.forEach((p) => {
      content.push({ type: "image_url", image_url: { url: p.dataUrl } });
    });

    const tool = {
      type: "function",
      function: {
        name: "registrar_analise_visual",
        description: "Registra a análise visual estruturada do conjunto de fotos.",
        parameters: {
          type: "object",
          properties: {
            scores: {
              type: "object",
              properties: {
                visual_externo: { type: "number", minimum: 0, maximum: 10 },
                interior: { type: "number", minimum: 0, maximum: 10 },
                acabamento_visual: { type: "number", minimum: 0, maximum: 10 },
                conservacao_aparente: { type: "number", minimum: 0, maximum: 10 },
                liquidez_visual: { type: "number", minimum: 0, maximum: 10 },
              },
              required: ["visual_externo","interior","acabamento_visual","conservacao_aparente","liquidez_visual"],
              additionalProperties: false,
            },
            score_visual_geral: { type: "number", minimum: 0, maximum: 10 },
            ajuste_total_pct: { type: "number", minimum: -25, maximum: 20 },
            ajuste_breakdown: {
              type: "object",
              properties: {
                conservacao_visual_pct: { type: "number", minimum: -8, maximum: 8 },
                acabamento_visual_pct: { type: "number", minimum: -6, maximum: 6 },
                apelo_comercial_pct: { type: "number", minimum: -4, maximum: 4 },
                entorno_visual_pct: { type: "number", minimum: -2, maximum: 2 },
              },
              required: ["conservacao_visual_pct","acabamento_visual_pct","apelo_comercial_pct","entorno_visual_pct"],
              additionalProperties: false,
            },
            resumo_externo: { type: "string", description: "1-2 frases sobre fachada/rua/entorno" },
            resumo_interno: { type: "string", description: "1-2 frases sobre ambientes internos" },
            resumo_conservacao: { type: "string", description: "1-2 frases sobre conservação aparente" },
            resumo_geral: { type: "string", description: "1-2 frases conclusivas com tom cauteloso" },
            ambientes_identificados: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  foto_index: { type: "integer", minimum: 0 },
                  ambiente_detectado: { type: "string" },
                  observacao: { type: "string" },
                },
                required: ["foto_index","ambiente_detectado","observacao"],
                additionalProperties: false,
              },
            },
            sugestoes_melhorias: {
              type: "array",
              items: { type: "string" },
              description: "Sugestões práticas (pintura, modernização cozinha, paisagismo etc.)",
            },
          },
          required: [
            "scores","score_visual_geral","ajuste_total_pct","ajuste_breakdown",
            "resumo_externo","resumo_interno","resumo_conservacao","resumo_geral",
            "ambientes_identificados","sugestoes_melhorias",
          ],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "registrar_analise_visual" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Recarregue para continuar." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errTxt = await aiResp.text();
      console.error("Gateway error:", aiResp.status, errTxt);
      return new Response(JSON.stringify({ error: "Falha na análise visual" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("Resposta sem tool call:", JSON.stringify(aiData).slice(0, 500));
      return new Response(JSON.stringify({ error: "IA não retornou análise estruturada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("JSON inválido:", toolCall.function.arguments);
      return new Response(JSON.stringify({ error: "Resposta da IA inválida" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitização: garante limites
    const clamp = (n: number, min: number, max: number) =>
      Math.max(min, Math.min(max, Number(n) || 0));

    const ajusteBreak = parsed.ajuste_breakdown ?? {};
    const safe = {
      scores: {
        visual_externo: clamp(parsed.scores?.visual_externo ?? 0, 0, 10),
        interior: clamp(parsed.scores?.interior ?? 0, 0, 10),
        acabamento_visual: clamp(parsed.scores?.acabamento_visual ?? 0, 0, 10),
        conservacao_aparente: clamp(parsed.scores?.conservacao_aparente ?? 0, 0, 10),
        liquidez_visual: clamp(parsed.scores?.liquidez_visual ?? 0, 0, 10),
      },
      score_visual_geral: clamp(parsed.score_visual_geral ?? 0, 0, 10),
      ajuste_total_pct: clamp(parsed.ajuste_total_pct ?? 0, -25, 20),
      ajuste_breakdown: {
        conservacao_visual_pct: clamp(ajusteBreak.conservacao_visual_pct ?? 0, -8, 8),
        acabamento_visual_pct: clamp(ajusteBreak.acabamento_visual_pct ?? 0, -6, 6),
        apelo_comercial_pct: clamp(ajusteBreak.apelo_comercial_pct ?? 0, -4, 4),
        entorno_visual_pct: clamp(ajusteBreak.entorno_visual_pct ?? 0, -2, 2),
      },
      resumo_externo: String(parsed.resumo_externo ?? ""),
      resumo_interno: String(parsed.resumo_interno ?? ""),
      resumo_conservacao: String(parsed.resumo_conservacao ?? ""),
      resumo_geral: String(parsed.resumo_geral ?? ""),
      ambientes_identificados: Array.isArray(parsed.ambientes_identificados) ? parsed.ambientes_identificados : [],
      sugestoes_melhorias: Array.isArray(parsed.sugestoes_melhorias) ? parsed.sugestoes_melhorias : [],
      total_fotos_analisadas: photosLimited.length,
    };

    return new Response(JSON.stringify(safe), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("analyze-property-photos error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
