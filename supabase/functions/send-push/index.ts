import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- Web Push RFC 8291 encryption helpers ----

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

function lengthPrefix2(data: Uint8Array): Uint8Array {
  const prefix = new Uint8Array(2);
  prefix[0] = (data.length >> 8) & 0xff;
  prefix[1] = data.length & 0xff;
  return concat(prefix, data);
}

async function hkdfExtractAndExpand(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm));
  const infoWithCounter = concat(info, new Uint8Array([1]));
  const key2 = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const okm = new Uint8Array(await crypto.subtle.sign("HMAC", key2, infoWithCounter));
  return okm.slice(0, length);
}

function createInfo(type: string, clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const typeBytes = encoder.encode(type);
  // "Content-Encoding: <type>\0" + "P-256\0" + len(clientPub) + clientPub + len(serverPub) + serverPub
  return concat(
    encoder.encode("Content-Encoding: "),
    typeBytes,
    new Uint8Array([0]),
    encoder.encode("P-256"),
    new Uint8Array([0]),
    lengthPrefix2(clientPublicKey),
    lengthPrefix2(serverPublicKey),
  );
}

async function encryptPayload(
  clientPublicKeyBytes: Uint8Array,
  clientAuthBytes: Uint8Array,
  payload: Uint8Array,
): Promise<{ encrypted: Uint8Array; serverPublicKeyBytes: Uint8Array; salt: Uint8Array }> {
  // Generate ephemeral ECDH key pair
  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);
  const serverPublicKeyJwk = await crypto.subtle.exportKey("jwk", serverKeys.publicKey);
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, serverKeys.privateKey, 256),
  );

  // Salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // IKM via auth secret
  const encoder = new TextEncoder();
  const authInfo = encoder.encode("Content-Encoding: auth\0");
  const ikm = await hkdfExtractAndExpand(clientAuthBytes, sharedSecret, authInfo, 32);

  // Content encryption key
  const cekInfo = createInfo("aesgcm", clientPublicKeyBytes, serverPublicKeyRaw);
  const contentEncryptionKey = await hkdfExtractAndExpand(salt, ikm, cekInfo, 16);

  // Nonce
  const nonceInfo = createInfo("nonce", clientPublicKeyBytes, serverPublicKeyRaw);
  const nonce = await hkdfExtractAndExpand(salt, ikm, nonceInfo, 12);

  // Pad payload (2 bytes padding length + no padding)
  const paddedPayload = concat(new Uint8Array([0, 0]), payload);

  // AES-128-GCM encrypt
  const cekCryptoKey = await crypto.subtle.importKey("raw", contentEncryptionKey, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekCryptoKey, paddedPayload),
  );

  return { encrypted, serverPublicKeyBytes: serverPublicKeyRaw, salt };
}

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
  const sigDer = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, key, new TextEncoder().encode(unsignedToken)),
  );

  return `${unsignedToken}.${uint8ArrayToBase64url(sigDer)}`;
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@brokersapp.com.br";

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

        const { encrypted, serverPublicKeyBytes, salt } = await encryptPayload(clientPubKey, clientAuth, payloadBytes);

        const audience = new URL(sub.endpoint).origin;
        const jwt = await createVapidJwt(audience, vapidPublicKey, vapidPrivateKey, vapidSubject);

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aesgcm",
            "Crypto-Key": `dh=${uint8ArrayToBase64url(serverPublicKeyBytes)};p256ecdsa=${vapidPublicKey}`,
            Encryption: `salt=${uint8ArrayToBase64url(salt)}`,
            TTL: "86400",
          },
          body: encrypted,
        });

        if (response.status === 201 || response.status === 200) {
          sent++;
        } else if (response.status === 404 || response.status === 410) {
          invalidEndpoints.push(sub.endpoint);
          failed++;
        } else {
          console.error(`Push failed for ${sub.endpoint}: ${response.status} ${await response.text()}`);
          failed++;
        }
      } catch (err) {
        console.error(`Push error for ${sub.endpoint}:`, err);
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
