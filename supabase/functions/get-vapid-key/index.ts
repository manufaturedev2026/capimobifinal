const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 🔑 FALLBACK: chave VAPID pública para push notifications.
// Para um novo remix, gere um novo par com:  npx web-push generate-vapid-keys
// Depois: substitua a string abaixo pela CHAVE PÚBLICA e adicione VAPID_PRIVATE_KEY nos secrets.
// Manter aqui (mesmo vazio) garante que /anunciar e a loja não quebrem em remix sem config.
const FALLBACK_VAPID_PUBLIC_KEY = "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const vapidKey = Deno.env.get("VAPID_PUBLIC_KEY") || FALLBACK_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    return new Response(JSON.stringify({ error: "VAPID key not configured", configured: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ publicKey: vapidKey }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
