import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function inferTipoLead(name: string, categoryName?: string, fallback?: string): string {
  const text = `${name || ""} ${categoryName || ""}`.toLowerCase();
  if (/imobili[áa]ria|im[óo]veis|realty|real estate/.test(text)) return "imobiliaria";
  if (/corretor|broker|consultor de im[óo]veis/.test(text)) return "corretor";
  return fallback === "corretor" ? "corretor" : "imobiliaria";
}

function cleanPhone(p?: string | null): string | null {
  if (!p) return null;
  const digits = p.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

function isValidEmail(e?: string | null): boolean {
  if (!e) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: roleRow } = await supabase
    .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
  if (!roleRow) {
    return new Response(JSON.stringify({ error: "Apenas administradores" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const startedAt = Date.now();
  try {
    const { run_id } = await req.json() as { run_id: string };
    if (!run_id) throw new Error("run_id obrigatório");

    const { data: run, error: runErr } = await supabase
      .from("apify_search_runs").select("*").eq("id", run_id).maybeSingle();
    if (runErr || !run) throw new Error("Busca não encontrada");
    if (!run.apify_run_id) throw new Error("Esta busca não possui apify_run_id");

    const { data: settings } = await supabase
      .from("platform_settings").select("key, value").in("key", ["apify_token"]);
    const apifyToken = (settings || []).find((s: any) => s.key === "apify_token")?.value;
    if (!apifyToken) throw new Error("Token da Apify não configurado");

    const sRes = await fetch(`https://api.apify.com/v2/actor-runs/${run.apify_run_id}?token=${apifyToken}`);
    if (!sRes.ok) throw new Error(`Falha ao consultar run na Apify (${sRes.status})`);
    const sJson = await sRes.json();
    const status = sJson?.data?.status as string;
    const datasetId = sJson?.data?.defaultDatasetId as string | undefined;

    if (status === "RUNNING" || status === "READY") {
      return new Response(JSON.stringify({ success: true, status, message: "Apify ainda rodando" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (status !== "SUCCEEDED") {
      await supabase.from("apify_search_runs").update({
        status: "erro",
        error_message: `Apify run terminou com status: ${status}`,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
      }).eq("id", run_id);
      return new Response(JSON.stringify({ success: true, status, message: "Run não finalizou com sucesso" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!datasetId) throw new Error("Run sem defaultDatasetId");

    const processInBackground = async () => {
      const bgStart = Date.now();
      try {
        const dsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&clean=true&format=json`);
        if (!dsRes.ok) throw new Error(`Falha ao ler dataset (${dsRes.status})`);
        const items = (await dsRes.json()) as any[];
        const retornados = items.length;

        // Normalize all leads first
        const normalized = items.map((it) => {
          const nome = it.title || it.name;
          if (!nome) return null;
          const email = (it.emails?.[0] || it.email || null)?.toLowerCase().trim();
          const telefone = cleanPhone(it.phone || it.phoneUnformatted);
          const placeId = it.placeId || it.cid || null;
          const tipo = inferTipoLead(nome, it.categoryName, run.tipo_lead === "ambos" ? undefined : run.tipo_lead);
          return {
            nome,
            tipo_lead: tipo,
            empresa: nome,
            email: isValidEmail(email) ? email : null,
            whatsapp: telefone,
            telefone,
            site: it.website || null,
            instagram: it.instagrams?.[0] || null,
            cidade: it.city || run.cidade,
            estado: it.state || run.estado,
            endereco: it.address || null,
            cep: it.postalCode || null,
            rating: it.totalScore || null,
            reviews_count: it.reviewsCount || null,
            google_place_id: placeId,
            apify_run_id: run_id,
            raw_data: it,
            ultima_atualizacao: new Date().toISOString(),
          };
        }).filter(Boolean) as any[];

        // Bulk fetch existing leads
        const placeIds = [...new Set(normalized.map((l) => l.google_place_id).filter(Boolean))];
        const emails = [...new Set(normalized.map((l) => l.email).filter(Boolean))];
        const existingByPlace = new Map<string, string>();
        const existingByEmail = new Map<string, string>();

        if (placeIds.length) {
          const { data } = await supabase.from("leads_imobiliarios")
            .select("id, google_place_id").in("google_place_id", placeIds);
          (data || []).forEach((r: any) => existingByPlace.set(r.google_place_id, r.id));
        }
        if (emails.length) {
          const { data } = await supabase.from("leads_imobiliarios")
            .select("id, email").in("email", emails);
          (data || []).forEach((r: any) => existingByEmail.set(r.email, r.id));
        }

        const toInsert: any[] = [];
        const toUpdate: { id: string; lead: any }[] = [];
        for (const lead of normalized) {
          const existingId = (lead.google_place_id && existingByPlace.get(lead.google_place_id))
            || (lead.email && existingByEmail.get(lead.email));
          if (existingId) toUpdate.push({ id: existingId, lead });
          else toInsert.push(lead);
        }

        let importados = 0;
        // Bulk insert in chunks of 200
        for (let i = 0; i < toInsert.length; i += 200) {
          const chunk = toInsert.slice(i, i + 200);
          const { error } = await supabase.from("leads_imobiliarios").insert(chunk);
          if (!error) importados += chunk.length;
        }
        // Updates in parallel batches
        for (let i = 0; i < toUpdate.length; i += 20) {
          const batch = toUpdate.slice(i, i + 20);
          await Promise.all(batch.map(({ id, lead }) =>
            supabase.from("leads_imobiliarios").update(lead).eq("id", id)
          ));
        }

        await supabase.from("apify_search_runs").update({
          status: "concluido",
          quantidade_retornada: retornados,
          quantidade_importada: importados,
          quantidade_duplicada: toUpdate.length,
          duration_ms: Date.now() - bgStart,
          finished_at: new Date().toISOString(),
        }).eq("id", run_id);
      } catch (e: any) {
        console.error("apify-sync-run background error", e);
        await supabase.from("apify_search_runs").update({
          status: "erro",
          error_message: e?.message || String(e),
          finished_at: new Date().toISOString(),
          duration_ms: Date.now() - bgStart,
        }).eq("id", run_id);
      }
    };

    // @ts-ignore EdgeRuntime
    EdgeRuntime.waitUntil(processInBackground());

    return new Response(JSON.stringify({
      success: true, status, message: "Importação iniciada em segundo plano. Atualize em alguns segundos.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("apify-sync-run error", err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});