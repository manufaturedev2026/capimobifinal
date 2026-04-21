import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    if (!address || typeof address !== "string" || !address.trim()) {
      return new Response(JSON.stringify({ error: "address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "missing key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address,
    )}&region=br&language=pt-BR&key=${key}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      console.warn("[geocode] failed", { address, status: data.status });
      return new Response(
        JSON.stringify({ status: data.status, lat: null, lng: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const loc = data.results[0].geometry.location;
    const formatted = data.results[0].formatted_address;
    console.log("[geocode] ok", { address, lat: loc.lat, lng: loc.lng });

    return new Response(
      JSON.stringify({
        status: "OK",
        lat: loc.lat,
        lng: loc.lng,
        formatted_address: formatted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[geocode] error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
