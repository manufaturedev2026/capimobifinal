import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- Utility helpers ----

function base64urlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
  const bin = atob(padded);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const len = arrays.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(len);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ---- RFC 8291 aes128gcm encryption ----

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm));
  const key2 = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const okm = new Uint8Array(await crypto.subtle.sign("HMAC", key2, concat(info, new Uint8Array([1]))));
  return okm.slice(0, length);
}

async function encryptPayload(
  clientPublicKeyBytes: Uint8Array,
  clientAuthBytes: Uint8Array,
  payload: Uint8Array,
): Promise<Uint8Array> {
  const encoder = new TextEncoder();

  // Generate ephemeral ECDH key pair
  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));

  // Import client public key
  const clientKey = await crypto.subtle.importKey("raw", clientPublicKeyBytes, { name: "ECDH", namedCurve: "P-256" }, false, []);

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, serverKeys.privateKey, 256),
  );

  // Salt (random 16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // RFC 8291 aes128gcm key derivation
  // IKM = HKDF(auth, sharedSecret, "WebPush: info\0" + clientPub + serverPub, 32)
  const authInfo = concat(
    encoder.encode("WebPush: info\0"),
    clientPublicKeyBytes,
    serverPublicKeyRaw,
  );
  const ikm = await hkdf(clientAuthBytes, sharedSecret, authInfo, 32);

  // CEK = HKDF(salt, ikm, "Content-Encoding: aes128gcm\0", 16)
  const cekInfo = encoder.encode("Content-Encoding: aes128gcm\0");
  const contentEncryptionKey = await hkdf(salt, ikm, cekInfo, 16);

  // Nonce = HKDF(salt, ikm, "Content-Encoding: nonce\0", 12)
  const nonceInfo = encoder.encode("Content-Encoding: nonce\0");
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  // Pad: payload + delimiter (0x02) for final record
  const paddedPayload = concat(payload, new Uint8Array([2]));

  // AES-128-GCM encrypt
  const cekCryptoKey = await crypto.subtle.importKey("raw", contentEncryptionKey, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekCryptoKey, paddedPayload),
  );

  // Build aes128gcm body: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = 4096;
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, rs, false);
  const idLen = new Uint8Array([serverPublicKeyRaw.length]); // 65

  return concat(salt, rsBytes, idLen, serverPublicKeyRaw, ciphertext);
}

// ---- VAPID JWT ----

async function createVapidJwt(
  audience: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const claims = { aud: audience, exp: now + 12 * 60 * 60, sub: vapidSubject };

  const headerB64 = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  const privKeyBytes = base64urlToUint8Array(vapidPrivateKey);
  const pubKeyBytes = base64urlToUint8Array(vapidPublicKey);

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: uint8ArrayToBase64url(pubKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64url(pubKeyBytes.slice(33, 65)),
    d: uint8ArrayToBase64url(privKeyBytes),
  };

  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, key, new TextEncoder().encode(unsignedToken)),
  );

  return `${unsignedToken}.${uint8ArrayToBase64url(sig)}`;
}

// ---- Main handler ----

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, body, url, image } = await req.json();
    if (!title || !body) {
      return new Response(JSON.stringify({ error: "Title and body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ---- Daily push limit by plan tier ----
    const { data: isAdminData } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdminData) {
      const { data: subData } = await adminClient
        .from("seller_subscriptions")
        .select("tier")
        .eq("seller_id", profile.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const tier = (subData?.tier as string) || "basico";
      const TIER_DAILY_LIMITS: Record<string, number> = {
        basico: 1,
        start: 1,
        premium: 2,           // Display: VIP
        vip: 3,               // Display: Premium
        basico_empresa: 1,    // Básico Empresa
        essencial_empresa: 4, // Exclusive
        premium_empresa: 5,   // Prime
        prime_empresa: 6,     // Black
        black: 6,             // Black (alias)
      };
      const dailyLimit = TIER_DAILY_LIMITS[tier] ?? 1;

      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { count: sentToday } = await adminClient
        .from("push_notifications_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", since.toISOString());

      if ((sentToday ?? 0) >= dailyLimit) {
        return new Response(
          JSON.stringify({
            error: "daily_limit_reached",
            message: `Limite diário do seu plano atingido (${dailyLimit} envio(s) por dia). Faça upgrade para enviar mais notificações.`,
            limit: dailyLimit,
            sent_today: sentToday,
            tier,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { data: subscriptions } = await adminClient
      .from("push_subscriptions")
      .select("*")
      .eq("seller_id", profile.id);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, failed: 0, message: "No subscribers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@capimobi.com.br";

    const payloadObj: Record<string, string> = { title, body };
    if (url) payloadObj.url = url;
    if (image) payloadObj.image = image;
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payloadObj));

    let sent = 0;
    let failed = 0;
    const invalidEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        const clientPubKey = base64urlToUint8Array(sub.p256dh);
        const clientAuth = base64urlToUint8Array(sub.auth);

        const encryptedBody = await encryptPayload(clientPubKey, clientAuth, payloadBytes);

        const audience = new URL(sub.endpoint).origin;
        const jwt = await createVapidJwt(audience, vapidPublicKey, vapidPrivateKey, vapidSubject);

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            TTL: "86400",
          },
          body: encryptedBody,
        });

        if (response.status === 201 || response.status === 200) {
          sent++;
        } else if (response.status === 404 || response.status === 410) {
          invalidEndpoints.push(sub.endpoint);
          failed++;
        } else {
          const errText = await response.text();
          console.error(`Push failed ${sub.endpoint}: ${response.status} ${errText}`);
          failed++;
        }
      } catch (err) {
        console.error(`Push error ${sub.endpoint}:`, err);
        failed++;
      }
    }

    if (invalidEndpoints.length > 0) {
      await adminClient
        .from("push_subscriptions")
        .delete()
        .eq("seller_id", profile.id)
        .in("endpoint", invalidEndpoints);
    }

    await adminClient.from("push_notifications_log").insert({
      seller_id: profile.id,
      user_id: user.id,
      title,
      body,
      url: url || null,
      sent_count: sent,
      failed_count: failed,
    });

    return new Response(JSON.stringify({ sent, failed, total: subscriptions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
