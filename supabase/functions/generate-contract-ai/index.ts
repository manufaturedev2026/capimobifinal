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
    const credit = await consumeAiCredits(req, "contract_generation", corsHeaders);
    if (!credit.ok) return credit.response;

    const userPrompt = `Você é um advogado especialista em direito imobiliário brasileiro. Gere um contrato imobiliário COMPLETO, profissional e juridicamente sólido com base nas informações abaixo. Use linguagem formal, cláusulas numeradas, e termos técnicos corretos da Lei do Inquilinato (8.245/91) e Código Civil quando aplicável.

DADOS:
- Tipo de contrato: ${data.tipo || "Não especificado"}
- Proprietário/Vendedor: ${data.nome_proprietario || "—"} | CPF/CNPJ: ${data.cpf_proprietario || "—"}
- Cliente/Inquilino/Comprador: ${data.nome_cliente || "—"} | CPF/CNPJ: ${data.cpf_cliente || "—"}
- Endereço do imóvel: ${data.endereco || "—"}
- Valor: R$ ${data.valor || "—"}
- Prazo: ${data.prazo || "—"}
- Garantia: ${data.garantia || "Não informada"}
- Multa por descumprimento: ${data.multa || "Padrão de mercado"}
- Reajuste: ${data.reajuste || "IGP-M anual"}
- Cidade/Foro: ${data.cidade || "—"}
- Observações adicionais: ${data.observacoes || "Nenhuma"}

INSTRUÇÕES:
- Inclua cabeçalho com "CONTRATO DE [TIPO]"
- Identifique as partes corretamente
- Adicione 8 a 14 cláusulas numeradas (objeto, prazo, valor, reajuste, garantia, obrigações, multa, rescisão, foro)
- Termine com data, cidade e linhas para assinaturas das partes e 2 testemunhas
- Use formatação em texto puro (sem markdown), com quebras de linha entre cláusulas
- Em português brasileiro formal
- Retorne via tool: titulo (ex: "Contrato de Locação Residencial — João Silva") e content (texto completo do contrato)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "return_contract",
            parameters: {
              type: "object",
              properties: {
                titulo: { type: "string", description: "Título curto do contrato com nome do cliente" },
                content: { type: "string", description: "Texto completo do contrato em texto puro" },
              },
              required: ["titulo", "content"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_contract" } },
      }),
    });

    if (!response.ok) {
      await refundAiCredits(credit.admin, credit.userId, credit.sellerId, credit.cost, "contract_generation");
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
    if (!tc) throw new Error("No contract returned");
    return new Response(tc.function.arguments, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
