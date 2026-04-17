import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchInput {
  tipo_lead: "imobiliaria" | "corretor" | "ambos";
  estado?: string;
  cidade?: string;
  palavra_chave?: string;
  quantidade: number;
}

const APIFY_RUN_MEMORY_MB = 1024;
const APIFY_RUN_TIMEOUT_SECONDS = 1800;

function buildQueries(input: SearchInput): string[] {
  const local = [input.cidade, input.estado].filter(Boolean).join(", ");
  const base = input.palavra_chave?.trim();
  const queries: string[] = [];

  if (base) {
    queries.push(local ? `${base} em ${local}` : base);
    return queries;
  }

  if (input.tipo_lead === "imobiliaria" || input.tipo_lead === "ambos") {
    queries.push(local ? `imobiliária em ${local}` : "imobiliária Brasil");
  }
  if (input.tipo_lead === "corretor" || input.tipo_lead === "ambos") {
    queries.push(local ? `corretor de imóveis em ${local}` : "corretor de imóveis Brasil");
  }
  return queries;
}

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

function normalizeApifyStartError(status: number, text: string) {
  const lower = text.toLowerCase();

  if (status === 401 || lower.includes("user-or-token-not-found")) {
    return {
      code: "APIFY_AUTH_INVALID",
      message: "Token da Apify inválido. Revise o campo Apify API Token nas configurações.",
    };
  }

  if (status === 402 || lower.includes("actor-memory-limit-exceeded")) {
    return {
      code: "APIFY_MEMORY_LIMIT",
      message:
        "Sua conta da Apify está sem memória disponível no momento. Aguarde as execuções ativas terminarem ou faça upgrade do plano. Reduzi os próximos runs para 1024MB para ajudar.",
    };
  }

  return {
    code: "APIFY_START_FAILED",
    message: `Falha ao iniciar busca na Apify (${status}).`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
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
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) {
    return new Response(JSON.stringify({ error: "Apenas administradores" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let runId: string | null = null;

  try {
    const input = (await req.json()) as SearchInput;
    const quantidade = Math.min(Math.max(input.quantidade || 50, 1), 1000);

    const { data: settings } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["apify_token", "apify_actor_id"]);

    const settingsMap = Object.fromEntries((settings || []).map((s) => [s.key, s.value]));
    const apifyToken = settingsMap.apify_token;
    const actorId = settingsMap.apify_actor_id || "compass~crawler-google-places";

    if (!apifyToken) throw new Error("Token da Apify não configurado");

    const { data: runRow, error: runErr } = await supabase
      .from("apify_search_runs")
      .insert({
        user_id: userData.user.id,
        tipo_lead: input.tipo_lead,
        estado: input.estado,
        cidade: input.cidade,
        palavra_chave: input.palavra_chave,
        quantidade_solicitada: quantidade,
        actor_id: actorId,
        status: "rodando",
      })
      .select()
      .single();
    if (runErr) throw runErr;
    runId = runRow.id;

    const queries = buildQueries({ ...input, quantidade });
    const maxPerSearch = Math.max(1, Math.ceil(quantidade / Math.max(queries.length, 1)));
    const startUrl = new URL(`https://api.apify.com/v2/acts/${actorId}/runs`);
    startUrl.searchParams.set("token", apifyToken);
    startUrl.searchParams.set("memory", String(APIFY_RUN_MEMORY_MB));
    startUrl.searchParams.set("timeout", String(APIFY_RUN_TIMEOUT_SECONDS));
    startUrl.searchParams.set("maxItems", String(quantidade));

    const body = {
      searchStringsArray: queries,
      maxCrawledPlacesPerSearch: maxPerSearch,
      language: "pt-BR",
      countryCode: "br",
      scrapeContacts: true,
    };

    const startRes = await fetch(startUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!startRes.ok) {
      const txt = await startRes.text();
      const normalized = normalizeApifyStartError(startRes.status, txt);

      if (runId) {
        await supabase
          .from("apify_search_runs")
          .update({
            status: "erro",
            error_message: normalized.message,
            duration_ms: Date.now() - startedAt,
            finished_at: new Date().toISOString(),
          })
          .eq("id", runId);
      }

      return new Response(
        JSON.stringify({ success: false, code: normalized.code, error: normalized.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const runJson = await startRes.json();
    const apifyRunId: string | null = runJson?.data?.id || null;
    const datasetId: string | null = runJson?.data?.defaultDatasetId || null;

    await supabase.from("apify_search_runs").update({ apify_run_id: apifyRunId }).eq("id", runId);

    const processInBackground = async () => {
      const bgStart = Date.now();
      try {
        if (!apifyRunId || !datasetId) {
          throw new Error("Run iniciado sem identificadores válidos da Apify.");
        }

        let status = "RUNNING";
        for (let i = 0; i < 300; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          const sRes = await fetch(`https://api.apify.com/v2/actor-runs/${apifyRunId}?token=${apifyToken}`);
          if (!sRes.ok) continue;
          const sJson = await sRes.json();
          status = sJson?.data?.status;
          if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) break;
        }

        if (status !== "SUCCEEDED") {
          await supabase.from("apify_search_runs").update({
            status: "erro",
            error_message: `Apify run terminou com status: ${status}`,
            duration_ms: Date.now() - bgStart,
            finished_at: new Date().toISOString(),
          }).eq("id", runId);
          return;
        }

        const dsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&clean=true&format=json`);
        if (!dsRes.ok) {
          throw new Error(`Falha ao ler dataset da Apify (${dsRes.status}).`);
        }

        const items = (await dsRes.json()) as any[];
        const retornados = items.length;

        let importados = 0;
        let duplicados = 0;

        for (const it of items) {
          const nome = it.title || it.name;
          if (!nome) continue;

          const email = (it.emails?.[0] || it.email || null)?.toLowerCase().trim();
          const telefone = cleanPhone(it.phone || it.phoneUnformatted);
          const placeId = it.placeId || it.cid || null;
          const tipo = inferTipoLead(nome, it.categoryName, input.tipo_lead === "ambos" ? undefined : input.tipo_lead);

          const lead = {
            nome,
            tipo_lead: tipo,
            empresa: nome,
            email: isValidEmail(email) ? email : null,
            whatsapp: telefone,
            telefone,
            site: it.website || null,
            instagram: it.instagrams?.[0] || null,
            cidade: it.city || input.cidade,
            estado: it.state || input.estado,
            endereco: it.address || null,
            cep: it.postalCode || null,
            rating: it.totalScore || null,
            reviews_count: it.reviewsCount || null,
            google_place_id: placeId,
            apify_run_id: runId,
            raw_data: it,
            ultima_atualizacao: new Date().toISOString(),
          };

          let existing = null as any;
          if (placeId) {
            const { data } = await supabase
              .from("leads_imobiliarios")
              .select("id")
              .eq("google_place_id", placeId)
              .maybeSingle();
            existing = data;
          }
          if (!existing && lead.email) {
            const { data } = await supabase
              .from("leads_imobiliarios")
              .select("id")
              .eq("email", lead.email)
              .maybeSingle();
            existing = data;
          }

          if (existing) {
            await supabase.from("leads_imobiliarios").update(lead).eq("id", existing.id);
            duplicados++;
          } else {
            const { error } = await supabase.from("leads_imobiliarios").insert(lead);
            if (!error) importados++;
          }
        }

        await supabase.from("apify_search_runs").update({
          status: "concluido",
          quantidade_retornada: retornados,
          quantidade_importada: importados,
          quantidade_duplicada: duplicados,
          duration_ms: Date.now() - bgStart,
          finished_at: new Date().toISOString(),
        }).eq("id", runId);
      } catch (e: any) {
        console.error("background task error", e);
        await supabase.from("apify_search_runs").update({
          status: "erro",
          error_message: e?.message || String(e),
          duration_ms: Date.now() - bgStart,
          finished_at: new Date().toISOString(),
        }).eq("id", runId);
      }
    };

    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(processInBackground());

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      apify_run_id: apifyRunId,
      message: "Busca iniciada em segundo plano. Acompanhe o status na aba de logs.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("apify-search-leads error", err);
    if (runId) {
      await supabase.from("apify_search_runs").update({
        status: "erro",
        error_message: err?.message || String(err),
        duration_ms: Date.now() - startedAt,
        finished_at: new Date().toISOString(),
      }).eq("id", runId);
    }
    return new Response(JSON.stringify({ error: err?.message || "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
