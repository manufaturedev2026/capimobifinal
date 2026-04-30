import { createClient } from "npm:@supabase/supabase-js@2.104.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function b64urlToU8(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
  const bin = atob(padded);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
function u8ToB64url(arr: Uint8Array): string {
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function concat(...arrays: Uint8Array[]): Uint8Array {
  const len = arrays.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(len);
  let offset = 0;
  for (const a of arrays) { result.set(a, offset); offset += a.length; }
  return result;
}
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm));
  const key2 = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key2, concat(info, new Uint8Array([1])))).slice(0, length);
}
async function encryptPayload(clientPub: Uint8Array, clientAuth: Uint8Array, payload: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const serverPub = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
  const clientKey = await crypto.subtle.importKey("raw", clientPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, serverKeys.privateKey, 256));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const authInfo = concat(enc.encode("WebPush: info\0"), clientPub, serverPub);
  const ikm = await hkdf(clientAuth, shared, authInfo, 32);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const padded = concat(payload, new Uint8Array([2]));
  const cekKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, padded));
  const rsBytes = new Uint8Array(4); new DataView(rsBytes.buffer).setUint32(0, 4096, false);
  return concat(salt, rsBytes, new Uint8Array([serverPub.length]), serverPub, ct);
}
async function createVapidJwt(audience: string, vapidPub: string, vapidPriv: string, sub: string): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const claims = { aud: audience, exp: now + 12 * 60 * 60, sub };
  const headerB64 = u8ToB64url(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = u8ToB64url(new TextEncoder().encode(JSON.stringify(claims)));
  const unsigned = `${headerB64}.${claimsB64}`;
  const priv = b64urlToU8(vapidPriv);
  const pub = b64urlToU8(vapidPub);
  const jwk = { kty: "EC", crv: "P-256", x: u8ToB64url(pub.slice(1, 33)), y: u8ToB64url(pub.slice(33, 65)), d: u8ToB64url(priv) };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, key, new TextEncoder().encode(unsigned)));
  return `${unsigned}.${u8ToB64url(sig)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { kind, tier, amount, credits, user_id, billing_period } = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Buyer info
    let buyerName = "Cliente";
    let buyerEmail = "";
    if (user_id) {
      const { data: prof } = await admin
        .from("profiles")
        .select("full_name, email, company_name")
        .eq("user_id", user_id)
        .maybeSingle();
      if (prof) {
        buyerName = prof.company_name || prof.full_name || prof.email || "Cliente";
        buyerEmail = prof.email || "";
      }
    }

    let title = "💰 Nova venda!";
    let body = "";
    const valor = amount ? `R$ ${Number(amount).toFixed(2).replace(".", ",")}` : "";

    if (kind === "credits") {
      title = "💎 Créditos vendidos!";
      body = `${buyerName} comprou ${credits || "?"} créditos${valor ? ` (${valor})` : ""}`;
    } else {
      title = "🚀 Plano vendido!";
      const periodo = billing_period === "annual" ? " (Anual)" : billing_period === "founder" ? " (Fundador)" : "";
      body = `${buyerName} assinou o plano ${tier || ""}${periodo}${valor ? ` - ${valor}` : ""}`;
    }

    // Get all admin user_ids
    const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
    const adminIds = (admins || []).map((a: any) => a.user_id).filter(Boolean);
    if (adminIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "no_admins" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subscriptions } = await admin
      .from("push_subscriptions")
      .select("*")
      .in("user_id", adminIds);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "no_subs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapidPub = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPriv = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidSub = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@capimobi.com.br";

    const payload = new TextEncoder().encode(JSON.stringify({
      title, body, url: "/admin",
    }));

    let sent = 0, failed = 0;
    const invalid: string[] = [];
    const seen = new Set<string>();
    const unique = subscriptions.filter((s: any) => seen.has(s.endpoint) ? false : (seen.add(s.endpoint), true));

    for (const sub of unique) {
      try {
        const ct = await encryptPayload(b64urlToU8(sub.p256dh), b64urlToU8(sub.auth), payload);
        const audience = new URL(sub.endpoint).origin;
        const jwt = await createVapidJwt(audience, vapidPub, vapidPriv, vapidSub);
        const r = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            Authorization: `vapid t=${jwt}, k=${vapidPub}`,
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            TTL: "86400",
          },
          body: ct,
        });
        if (r.status === 201 || r.status === 200) sent++;
        else if (r.status === 404 || r.status === 410) { invalid.push(sub.endpoint); failed++; }
        else failed++;
      } catch (e) { console.error("admin push err:", e); failed++; }
    }

    if (invalid.length > 0) {
      await admin.from("push_subscriptions").delete().in("endpoint", invalid);
    }

    return new Response(JSON.stringify({ ok: true, sent, failed, total: unique.length, buyer: buyerName, email: buyerEmail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-admin-purchase error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});