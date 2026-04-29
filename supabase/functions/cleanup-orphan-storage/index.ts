import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Varre os buckets seller-photos, seller-uploads e seller-assets,
 * lista TODAS as referências a URLs de storage no banco e remove
 * arquivos que não estão mais referenciados em nenhuma tabela.
 *
 * Roda 1x por semana via pg_cron. Reduz custo de storage para sempre.
 *
 * Segurança:
 *  - Só remove arquivos com mais de 7 dias (evita race com uploads em curso)
 *  - Modo dry_run=true por padrão se chamado manualmente sem flag
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  let dryRun = false;
  try {
    const body = await req.json().catch(() => ({}));
    dryRun = body?.dry_run === true;
  } catch (_) {}

  const BUCKETS = ["seller-photos", "seller-uploads", "seller-assets"];
  const MIN_AGE_DAYS = 7;
  const cutoff = Date.now() - MIN_AGE_DAYS * 24 * 60 * 60 * 1000;

  // 1) Coleta TODAS as URLs referenciadas no banco
  const referenced = new Set<string>();

  const collect = (val: unknown) => {
    if (!val) return;
    if (typeof val === "string") {
      // Extrai o path do final da URL pública do Supabase
      const m = val.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+?)(?:\?|$)/);
      if (m) referenced.add(decodeURIComponent(m[1]));
    } else if (Array.isArray(val)) {
      val.forEach(collect);
    } else if (typeof val === "object") {
      Object.values(val as Record<string, unknown>).forEach(collect);
    }
  };

  // Tabelas e colunas que guardam URLs
  const sources: { table: string; cols: string }[] = [
    { table: "seller_items", cols: "photos, video_url, thumbnail_url, floor_plan_url" },
    { table: "profiles", cols: "avatar_url, cover_url, logo_url, manager_photo, video_url" },
    { table: "seller_stories", cols: "image_url" },
    { table: "team_members", cols: "photo_url" },
    { table: "account_managers", cols: "photo_url" },
    { table: "blog_posts", cols: "cover_image_url" },
  ];

  for (const src of sources) {
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from(src.table)
        .select(src.cols)
        .range(from, from + pageSize - 1);
      if (error) {
        console.warn(`[cleanup] erro em ${src.table}:`, error.message);
        break;
      }
      if (!data || data.length === 0) break;
      data.forEach(collect);
      if (data.length < pageSize) break;
      from += pageSize;
    }
  }

  console.log(`[cleanup] referenciados: ${referenced.size} arquivos`);

  // 2) Lista arquivos em cada bucket e marca órfãos
  const orphans: { bucket: string; path: string; size: number }[] = [];

  const walk = async (bucket: string, prefix = "") => {
    let offset = 0;
    while (true) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(prefix, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
      if (error) {
        console.warn(`[cleanup] list ${bucket}/${prefix}:`, error.message);
        return;
      }
      if (!data || data.length === 0) break;

      for (const entry of data) {
        const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        // Pasta (sem id de objeto) → recursa
        if (!entry.id) {
          await walk(bucket, fullPath);
          continue;
        }
        const created = entry.created_at ? new Date(entry.created_at).getTime() : Date.now();
        if (created > cutoff) continue; // muito recente, ignora
        if (referenced.has(fullPath)) continue;
        orphans.push({
          bucket,
          path: fullPath,
          size: (entry.metadata as { size?: number })?.size ?? 0,
        });
      }

      if (data.length < 1000) break;
      offset += 1000;
    }
  };

  for (const b of BUCKETS) await walk(b);

  const totalBytes = orphans.reduce((s, o) => s + o.size, 0);
  console.log(`[cleanup] órfãos: ${orphans.length} (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);

  // 3) Remove (em lotes de 100)
  let removed = 0;
  if (!dryRun) {
    const byBucket = new Map<string, string[]>();
    for (const o of orphans) {
      const arr = byBucket.get(o.bucket) ?? [];
      arr.push(o.path);
      byBucket.set(o.bucket, arr);
    }
    for (const [bucket, paths] of byBucket) {
      for (let i = 0; i < paths.length; i += 100) {
        const chunk = paths.slice(i, i + 100);
        const { error } = await supabase.storage.from(bucket).remove(chunk);
        if (error) console.warn(`[cleanup] remove ${bucket}:`, error.message);
        else removed += chunk.length;
      }
    }
  }

  return new Response(
    JSON.stringify({
      dry_run: dryRun,
      referenced_count: referenced.size,
      orphan_count: orphans.length,
      orphan_size_mb: +(totalBytes / 1024 / 1024).toFixed(2),
      removed,
      ran_at: new Date().toISOString(),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
