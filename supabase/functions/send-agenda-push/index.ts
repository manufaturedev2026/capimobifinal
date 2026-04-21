import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- Web Push helpers (RFC 8291 aes128gcm + VAPID) ----

function b64uToU8(s: string): Uint8Array {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b.length % 4;
  const padded = pad ? b + "=".repeat(4 - pad) : b;
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
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", k, ikm));
  const k2 = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const okm = new Uint8Array(await crypto.subtle.sign("HMAC", k2, concat(info, new Uint8Array([1]))));
  return okm.slice(0, length);
}
async function encryptPayload(clientPub: Uint8Array, clientAuth: Uint8Array, payload: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const serverPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
  const clientKey = await crypto.subtle.importKey("raw", clientPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, serverKeys.privateKey, 256));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const ikm = await hkdf(clientAuth, shared, concat(enc.encode("WebPush: info\0"), clientPub, serverPubRaw), 32);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const padded = concat(payload, new Uint8Array([2]));
  const cekKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, padded));
  const rs = new Uint8Array(4); new DataView(rs.buffer).setUint32(0, 4096, false);
  return concat(salt, rs, new Uint8Array([serverPubRaw.length]), serverPubRaw, ct);
}
async function createVapidJwt(audience: string, vapidPub: string, vapidPriv: string, sub: string): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const claims = { aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub };
  const enc = new TextEncoder();
  const h = u8ToB64u(enc.encode(JSON.stringify(header)));
  const c = u8ToB64u(enc.encode(JSON.stringify(claims)));
  const unsigned = `${h}.${c}`;
  const priv = b64uToU8(vapidPriv);
  const pub = b64uToU8(vapidPub);
  const jwk = { kty: "EC", crv: "P-256", x: u8ToB64u(pub.slice(1, 33)), y: u8ToB64u(pub.slice(33, 65)), d: u8ToB64u(priv) };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, key, enc.encode(unsigned)));
  return `${unsigned}.${u8ToB64u(sig)}`;
}

// ---- Send push to all subscriptions of a seller_id ----

async function sendPushToSeller(
  admin: ReturnType<typeof createClient>,
  sellerProfileId: string,
  title: string,
  body: string,
  url: string | null,
): Promise<{ sent: number; failed: number }> {
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("seller_id", sellerProfileId);
  if (!subs || subs.length === 0) return { sent: 0, failed: 0 };

  const vapidPub = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const vapidPriv = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const vapidSub = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@capimobi.com.br";
  const payloadObj: Record<string, string> = { title, body };
  if (url) payloadObj.url = url;
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payloadObj));

  let sent = 0, failed = 0;
  const invalid: string[] = [];

  for (const s of subs) {
    try {
      const enc = await encryptPayload(b64uToU8(s.p256dh), b64uToU8(s.auth), payloadBytes);
      const aud = new URL(s.endpoint).origin;
      const jwt = await createVapidJwt(aud, vapidPub, vapidPriv, vapidSub);
      const r = await fetch(s.endpoint, {
        method: "POST",
        headers: {
          Authorization: `vapid t=${jwt}, k=${vapidPub}`,
          "Content-Type": "application/octet-stream",
          "Content-Encoding": "aes128gcm",
          TTL: "86400",
        },
        body: enc,
      });
      if (r.status === 201 || r.status === 200) sent++;
      else if (r.status === 404 || r.status === 410) { invalid.push(s.endpoint); failed++; }
      else { console.error("push fail", r.status, await r.text()); failed++; }
    } catch (e) {
      console.error("push err", e); failed++;
    }
  }
  if (invalid.length > 0) {
    await admin.from("push_subscriptions").delete().eq("seller_id", sellerProfileId).in("endpoint", invalid);
  }
  return { sent, failed };
}

// ---- Resolve profile_id (seller_id used by push_subscriptions) from user_id ----
async function getProfileIdFromUserId(admin: ReturnType<typeof createClient>, userId: string): Promise<string | null> {
  const { data } = await admin.from("profiles").select("id").eq("user_id", userId).maybeSingle();
  return data?.id ?? null;
}

function formatTimeBR(t: string): string {
  // t = HH:MM:SS or HH:MM
  return t.slice(0, 5);
}
function formatDateBR(d: string): string {
  // d = YYYY-MM-DD
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

// ---- Main handler ----

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    const kind = body.kind as string;

    // Mode 1: Single visit just created
    if (kind === "created" && body.visit_id) {
      const { data: visit } = await admin
        .from("visit_appointments")
        .select("*")
        .eq("id", body.visit_id)
        .maybeSingle();
      if (!visit) return new Response(JSON.stringify({ skipped: "visit_not_found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const profileId = await getProfileIdFromUserId(admin, visit.user_id);
      if (!profileId) return new Response(JSON.stringify({ skipped: "no_profile" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const title = "📅 Nova visita agendada";
      const text = `${visit.client_name} • ${formatDateBR(visit.visit_date)} às ${formatTimeBR(visit.visit_time)}`;
      const result = await sendPushToSeller(admin, profileId, title, text, "/agenda");
      await admin.from("visit_appointments").update({ push_created_sent_at: new Date().toISOString() }).eq("id", visit.id);
      return new Response(JSON.stringify({ kind: "created", ...result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mode 2: Scheduled scan (every 15 min via cron)
    if (kind === "scan" || !kind) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const currentHour = now.getUTCHours() - 3; // BRT (UTC-3); good enough for window check
      const adjustedHour = ((currentHour % 24) + 24) % 24;

      let morningSent = 0;
      let hourBeforeSent = 0;

      // ---- 2a: Morning summary (between 08:00 and 08:59 BRT) ----
      if (adjustedHour === 8) {
        const { data: todayVisits } = await admin
          .from("visit_appointments")
          .select("id, user_id, client_name, visit_time, status, push_morning_sent_at")
          .eq("visit_date", todayStr)
          .in("status", ["pendente", "confirmada", "reagendada"])
          .is("push_morning_sent_at", null);

        // Group by user_id
        const byUser = new Map<string, any[]>();
        for (const v of todayVisits || []) {
          if (!byUser.has(v.user_id)) byUser.set(v.user_id, []);
          byUser.get(v.user_id)!.push(v);
        }

        for (const [userId, visits] of byUser.entries()) {
          const profileId = await getProfileIdFromUserId(admin, userId);
          if (!profileId) continue;
          visits.sort((a, b) => a.visit_time.localeCompare(b.visit_time));
          const first = visits[0];
          const title = visits.length === 1
            ? `📅 Visita hoje às ${formatTimeBR(first.visit_time)}`
            : `📅 Você tem ${visits.length} visitas hoje`;
          const text = visits.length === 1
            ? `${first.client_name} às ${formatTimeBR(first.visit_time)}`
            : `Primeira: ${first.client_name} às ${formatTimeBR(first.visit_time)}`;
          await sendPushToSeller(admin, profileId, title, text, "/agenda");
          await admin.from("visit_appointments")
            .update({ push_morning_sent_at: new Date().toISOString() })
            .in("id", visits.map((v) => v.id));
          morningSent += visits.length;
        }
      }

      // ---- 2b: 1 hour before reminders ----
      // Find visits today between (now+45min) and (now+75min) without hour_before push
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const inOneHourBRT = new Date(inOneHour.getTime() - 3 * 60 * 60 * 1000); // shift to "BRT clock"
      // We compare strings: visit_date + visit_time. Build window in BRT.
      const winStart = new Date(now.getTime() + 45 * 60 * 1000 - 3 * 60 * 60 * 1000);
      const winEnd = new Date(now.getTime() + 75 * 60 * 1000 - 3 * 60 * 60 * 1000);
      const winStartTime = winStart.toISOString().slice(11, 19);
      const winEndTime = winEnd.toISOString().slice(11, 19);
      const winDate = winStart.toISOString().slice(0, 10);

      const { data: soonVisits } = await admin
        .from("visit_appointments")
        .select("id, user_id, client_name, visit_date, visit_time, status, address, push_hour_before_sent_at")
        .eq("visit_date", winDate)
        .gte("visit_time", winStartTime)
        .lte("visit_time", winEndTime)
        .in("status", ["pendente", "confirmada", "reagendada"])
        .is("push_hour_before_sent_at", null);

      for (const v of soonVisits || []) {
        const profileId = await getProfileIdFromUserId(admin, v.user_id);
        if (!profileId) continue;
        const title = `⏰ Visita em ~1 hora`;
        const text = `${v.client_name} às ${formatTimeBR(v.visit_time)}${v.address ? ` • ${v.address}` : ""}`;
        await sendPushToSeller(admin, profileId, title, text, "/agenda");
        await admin.from("visit_appointments")
          .update({ push_hour_before_sent_at: new Date().toISOString() })
          .eq("id", v.id);
        hourBeforeSent++;
      }

      return new Response(
        JSON.stringify({ kind: "scan", morning_sent: morningSent, hour_before_sent: hourBeforeSent }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "unknown_kind" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-agenda-push error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
