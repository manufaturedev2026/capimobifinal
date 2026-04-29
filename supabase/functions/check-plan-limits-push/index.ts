import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- Crypto helpers (mesmo de send-push) ----
function b64uToU8(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
  const bin = atob(padded);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
function u8ToB64u(arr: Uint8Array): string {
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function concat(...arrays: Uint8Array[]): Uint8Array {
  const len = arrays.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) { result.set(a, off); off += a.length; }
  return result;
}
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
  const k = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", k, ikm));
  const k2 = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const okm = new Uint8Array(await crypto.subtle.sign("HMAC", k2, concat(info, new Uint8Array([1]))));
  return okm.slice(0, length);
}
async function encryptPayload(clientPub: Uint8Array, clientAuth: Uint8Array, payload: Uint8Array) {
  const enc = new TextEncoder();
  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const serverPub = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
  const cKey = await crypto.subtle.importKey("raw", clientPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: cKey }, serverKeys.privateKey, 256));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const authInfo = concat(enc.encode("WebPush: info\0"), clientPub, serverPub);
  const ikm = await hkdf(clientAuth, shared, authInfo, 32);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const padded = concat(payload, new Uint8Array([2]));
  const cekKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, padded));
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, 4096, false);
  return concat(salt, rsBytes, new Uint8Array([serverPub.length]), serverPub, ct);
}
async function vapidJwt(audience: string, pub: string, priv: string, sub: string) {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const claims = { aud: audience, exp: now + 12 * 60 * 60, sub };
  const hB64 = u8ToB64u(new TextEncoder().encode(JSON.stringify(header)));
  const cB64 = u8ToB64u(new TextEncoder().encode(JSON.stringify(claims)));
  const unsigned = `${hB64}.${cB64}`;
  const privKey = b64uToU8(priv);
  const pubKey = b64uToU8(pub);
  const jwk = {
    kty: "EC", crv: "P-256",
    x: u8ToB64u(pubKey.slice(1, 33)),
    y: u8ToB64u(pubKey.slice(33, 65)),
    d: u8ToB64u(privKey),
  };
  const k = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, k, new TextEncoder().encode(unsigned)));
  return `${unsigned}.${u8ToB64u(sig)}`;
}

// ---- Lógica principal ----

const THRESHOLDS = [85, 100];

const LIMIT_LABELS: Record<string, string> = {
  items: "anúncios",
  photos: "fotos",
  storage: "armazenamento",
  visits: "visitas mensais",
};

async function sendPushTo(
  admin: ReturnType<typeof createClient>,
  sellerId: string,
  title: string,
  body: string,
  url: string,
) {
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("seller_id", sellerId);
  if (!subs?.length) return { sent: 0 };

  const vPub = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const vPriv = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const vSub = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@capimobi.com.br";
  const payload = new TextEncoder().encode(JSON.stringify({ title, body, url }));

  let sent = 0;
  for (const s of subs) {
    try {
      const ct = await encryptPayload(b64uToU8(s.p256dh), b64uToU8(s.auth), payload);
      const audience = new URL(s.endpoint).origin;
      const jwt = await vapidJwt(audience, vPub, vPriv, vSub);
      const r = await fetch(s.endpoint, {
        method: "POST",
        headers: {
          Authorization: `vapid t=${jwt}, k=${vPub}`,
          "Content-Type": "application/octet-stream",
          "Content-Encoding": "aes128gcm",
          TTL: "86400",
        },
        body: ct,
      });
      if (r.status === 201 || r.status === 200) sent++;
      else if (r.status === 404 || r.status === 410) {
        await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    } catch (e) {
      console.error("push err", e);
    }
  }
  return { sent };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const periodStart = new Date();
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);
    const periodIso = periodStart.toISOString().slice(0, 10);

    // Busca todos os profiles ativos (com plano)
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, user_id, full_name");

    if (!profiles?.length) {
      return new Response(JSON.stringify({ checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let alertsSent = 0;
    let usersChecked = 0;

    for (const p of profiles) {
      try {
        const { data: usage } = await admin.rpc("get_user_plan_usage", { p_user_id: p.user_id });
        if (!usage) continue;
        usersChecked++;

        const u = (usage as any).usage || {};
        const l = (usage as any).limits || {};
        const planName = (usage as any).plan_name || "seu plano";

        const checks: Array<{ key: string; used: number; limit: number }> = [
          { key: "items", used: u.active_items ?? 0, limit: l.max_items ?? 0 },
          { key: "photos", used: u.total_photos ?? 0, limit: (l.max_items ?? 0) * (l.max_photos_per_listing ?? 0) },
          { key: "storage", used: u.storage_mb ?? 0, limit: l.storage_mb ?? 0 },
          { key: "visits", used: u.monthly_visits ?? 0, limit: l.monthly_visits_limit ?? 0 },
        ];

        for (const c of checks) {
          if (!c.limit || c.limit <= 0) continue;
          const pct = (c.used / c.limit) * 100;

          for (const threshold of THRESHOLDS) {
            if (pct < threshold) continue;

            // Idempotência: já enviou esse alerta neste mês?
            const { data: already } = await admin
              .from("plan_limit_alerts")
              .select("id")
              .eq("user_id", p.user_id)
              .eq("limit_key", c.key)
              .eq("threshold", threshold)
              .eq("period_start", periodIso)
              .maybeSingle();

            if (already) continue;

            const label = LIMIT_LABELS[c.key];
            const title = threshold >= 100
              ? `🚫 Limite de ${label} esgotado`
              : `⚠️ ${threshold}% do limite de ${label}`;
            const body = threshold >= 100
              ? `Você atingiu 100% do limite de ${label} do plano ${planName}. Faça upgrade para continuar crescendo.`
              : `Você já usou ${Math.round(pct)}% do limite de ${label} do plano ${planName}. Considere fazer upgrade.`;

            const r = await sendPushTo(admin, p.id, title, body, "/pacotes");

            await admin.from("plan_limit_alerts").insert({
              user_id: p.user_id,
              seller_id: p.id,
              limit_key: c.key,
              threshold,
              period_start: periodIso,
              current_value: c.used,
              limit_value: c.limit,
            });

            if (r.sent > 0) alertsSent++;
          }
        }
      } catch (e) {
        console.error(`check user ${p.user_id} err:`, e);
      }
    }

    return new Response(
      JSON.stringify({ checked: usersChecked, alerts_sent: alertsSent, period: periodIso }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("check-plan-limits-push fatal:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});