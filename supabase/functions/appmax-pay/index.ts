import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APPMAX_BASE = "https://admin.appmax.com.br/api/v3";

/**
 * Confirma pagamento PIX ou Cartão na AppMax.
 * Body: { order_id, method: "pix" | "credit-card", card?: {...}, installments?: number, document?: string }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const apiKey = Deno.env.get("APPMAX_API_KEY");
    if (!apiKey) throw new Error("APPMAX_API_KEY não configurada");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");
    const { data: udata } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = udata.user;
    if (!user) throw new Error("Não autenticado");

    const { order_id, method, card, installments = 1, document } = await req.json();
    if (!order_id) throw new Error("order_id obrigatório");
    if (!["pix", "credit-card"].includes(method)) throw new Error("Método inválido");

    // Verifica se o pedido pertence ao usuário
    const { data: payment } = await supabaseAdmin
      .from("appmax_payments" as any)
      .select("*")
      .eq("order_id", String(order_id))
      .eq("user_id", user.id)
      .maybeSingle();
    if (!payment) throw new Error("Pedido não encontrado");

    let endpoint = "";
    let body: any = { "access-token": apiKey };

    if (method === "pix") {
      endpoint = `${APPMAX_BASE}/payment/pix`;
      body = {
        ...body,
        cart: { order_id: Number(order_id) },
        customer: { customer_id: Number((payment as any).customer_id) },
        payment: {
          pix: {
            document_number: (document || "").replace(/\D/g, "") || undefined,
          },
        },
      };
    } else {
      if (!card?.number || !card?.holder || !card?.expiry || !card?.cvv) {
        throw new Error("Dados do cartão incompletos");
      }
      const [expMonth, expYearRaw] = String(card.expiry).split("/").map((s: string) => s.trim());
      const expYear = expYearRaw?.length === 2 ? `20${expYearRaw}` : expYearRaw;
      endpoint = `${APPMAX_BASE}/payment/credit-card`;
      body = {
        ...body,
        cart: { order_id: Number(order_id) },
        customer: { customer_id: Number((payment as any).customer_id) },
        payment: {
          CreditCard: {
            number: String(card.number).replace(/\s/g, ""),
            cvv: String(card.cvv),
            month: Number(expMonth),
            year: Number(expYear),
            document_number: (document || "").replace(/\D/g, "") || undefined,
            name: card.holder,
            installments: Number(installments) || 1,
            soft_descriptor: "CAPIMOBI",
          },
        },
      };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || !json?.data) {
      throw new Error(`AppMax pagamento falhou: ${json?.text || JSON.stringify(json)}`);
    }

    // Atualiza nosso registro
    const updates: any = { updated_at: new Date().toISOString() };
    if (method === "pix") {
      updates.pix_qr_code = json.data?.pix_qrcode || json.data?.pix_emv || null;
      updates.pix_emv = json.data?.pix_emv || null;
      updates.pix_expires_at = json.data?.pix_expiration_date || null;
    } else {
      // Cartão pode ser aprovado na hora
      const status = (json.data?.status || "").toLowerCase();
      if (status === "aprovado" || status === "approved") {
        updates.status = "approved";
      }
    }
    await supabaseAdmin.from("appmax_payments" as any).update(updates).eq("order_id", String(order_id));

    return new Response(
      JSON.stringify({
        ok: true,
        method,
        pix_qr_code: updates.pix_qr_code || null,
        pix_emv: updates.pix_emv || null,
        status: updates.status || "pending",
        raw: json.data,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[appmax-pay]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});