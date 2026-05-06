import { createClient } from "npm:@supabase/supabase-js@2.104.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
  const clientKey = await crypto.subtle.importKey("raw", clientPublicKeyBytes, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, serverKeys.privateKey, 256),
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const authInfo = concat(encoder.encode("WebPush: info\0"), clientPublicKeyBytes, serverPublicKeyRaw);
  const ikm = await hkdf(clientAuthBytes, sharedSecret, authInfo, 32);
  const cekInfo = encoder.encode("Content-Encoding: aes128gcm\0");
  const contentEncryptionKey = await hkdf(salt, ikm, cekInfo, 16);
  const nonceInfo = encoder.encode("Content-Encoding: nonce\0");
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);
  const paddedPayload = concat(payload, new Uint8Array([2]));
  const cekCryptoKey = await crypto.subtle.importKey("raw", contentEncryptionKey, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekCryptoKey, paddedPayload),
  );
  const rs = 4096;
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, rs, false);
  const idLen = new Uint8Array([serverPublicKeyRaw.length]);
  return concat(salt, rsBytes, idLen, serverPublicKeyRaw, ciphertext);
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
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, key, new TextEncoder().encode(unsignedToken)),
  );
  return `${unsignedToken}.${uint8ArrayToBase64url(sig)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    let userId = claimsData?.claims?.sub as string | undefined;

    if (claimsError || !userId) {
      const { data: userData, error: userError } = await adminClient.auth.getUser(token);
      userId = userError ? undefined : userData?.user?.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, body, url, image, audience: audienceFilter, state: stateFilter, city: cityFilter } = await req.json();
    if (!title || !body) {
      return new Response(JSON.stringify({ error: "Title and body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter sellers by category and/or region
    // audienceFilter: "all" | "corretor" | "imobiliaria" | "construtora" | "professionals" | "clients"
    const hasCategoryFilter = audienceFilter && audienceFilter !== "all";
    const hasRegionFilter = (stateFilter && stateFilter !== "all") || (cityFilter && cityFilter.trim());
    let sellerIdsFilter: string[] | null = null;
    let homepageSellerId: string | null = null;

    if (hasCategoryFilter || hasRegionFilter) {
      let profilesQuery = adminClient.from("profiles").select("id");
      if (hasCategoryFilter) {
        if (audienceFilter === "professionals") {
          profilesQuery = profilesQuery.in("seller_category", ["corretor", "imobiliaria", "construtora"]);
        } else if (audienceFilter === "clients") {
          profilesQuery = profilesQuery.or(
            "seller_category.is.null,seller_category.in.(proprietario,autonomo,loja_veiculos,concessionaria)"
          );
        } else {
          profilesQuery = profilesQuery.eq("seller_category", audienceFilter);
        }
      }
      if (stateFilter && stateFilter !== "all") {
        profilesQuery = profilesQuery.eq("state", stateFilter);
      }
      if (cityFilter && cityFilter.trim()) {
        profilesQuery = profilesQuery.ilike("city", cityFilter.trim());
      }
      const { data: filteredProfiles } = await profilesQuery;
      sellerIdsFilter = (filteredProfiles || []).map((p: any) => p.id);

      // Special case: "clients" audience also includes anonymous homepage subscribers.
      // They are stored under the admin's seller_id (the "mailbox" of the homepage button)
      // regardless of whether the admin profile itself matches the clients filter.
      if (audienceFilter === "clients" && !hasRegionFilter) {
        const { data: setting } = await adminClient
          .from("platform_settings")
          .select("value")
          .eq("key", "admin_push_seller_id")
          .maybeSingle();

        homepageSellerId = setting?.value ?? null;
        if (!homepageSellerId) {
          // Fallback: oldest admin's profile id (mirrors HomePwaActions logic)
          const { data: adminRole } = await adminClient
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin")
            .limit(1)
            .maybeSingle();
          if (adminRole?.user_id) {
            const { data: adminProf } = await adminClient
              .from("profiles")
              .select("id")
              .eq("user_id", adminRole.user_id)
              .maybeSingle();
            homepageSellerId = adminProf?.id ?? null;
          }
        }
        if (homepageSellerId && !sellerIdsFilter.includes(homepageSellerId)) {
          sellerIdsFilter.push(homepageSellerId);
        }
      }

      if (sellerIdsFilter.length === 0) {
        return new Response(JSON.stringify({ sent: 0, failed: 0, total: 0, message: "No matching sellers" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch push subscriptions. To avoid leaking the admin homepage audience
    // into the broker dashboard send (and vice versa), the homepage seller id
    // is fetched with scope = "admin_home" only, while all other seller ids
    // are fetched with scope = "store".
    let subscriptions: any[] = [];
    if (sellerIdsFilter) {
      const otherSellerIds = sellerIdsFilter.filter((id) => id !== homepageSellerId);
      const queries: Promise<any>[] = [];
      if (otherSellerIds.length > 0) {
        queries.push(
          adminClient
            .from("push_subscriptions")
            .select("*")
            .in("seller_id", otherSellerIds)
            .eq("scope", "store"),
        );
      }
      if (homepageSellerId) {
        queries.push(
          adminClient
            .from("push_subscriptions")
            .select("*")
            .eq("seller_id", homepageSellerId)
            .eq("scope", "admin_home"),
        );
      }
      const results = await Promise.all(queries);
      subscriptions = results.flatMap((r) => r.data || []);
    } else {
      // No filter = broadcast to everyone (all scopes).
      const { data } = await adminClient.from("push_subscriptions").select("*");
      subscriptions = data || [];
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, failed: 0, total: 0, message: "No subscribers" }), {
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

    // Deduplicate by endpoint
    const seen = new Set<string>();
    const uniqueSubs = subscriptions.filter((s) => {
      if (seen.has(s.endpoint)) return false;
      seen.add(s.endpoint);
      return true;
    });

    for (const sub of uniqueSubs) {
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
          console.error(`Push failed ${sub.endpoint}: ${response.status}`);
          failed++;
        }
      } catch (err) {
        console.error(`Push error:`, err);
        failed++;
      }
    }

    // Clean up invalid endpoints
    if (invalidEndpoints.length > 0) {
      await adminClient
        .from("push_subscriptions")
        .delete()
        .in("endpoint", invalidEndpoints);
    }

    // Log the admin broadcast
    const { data: adminProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (adminProfile) {
      await adminClient.from("push_notifications_log").insert({
        seller_id: adminProfile.id,
        user_id: userId,
        title,
        body,
        url: url || null,
        sent_count: sent,
        failed_count: failed,
      });
    }

    return new Response(JSON.stringify({ sent, failed, total: uniqueSubs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push-admin error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
