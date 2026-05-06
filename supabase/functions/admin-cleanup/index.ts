import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_TIERS = ["basico", "imob_basico", "const_basico"];
const STORAGE_BUCKETS = ["seller-photos", "seller-uploads", "seller-assets"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function listAllObjects(supabase: any, bucket: string, prefix: string): Promise<string[]> {
  const all: string[] = [];
  async function walk(path: string) {
    const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 1000 });
    if (error || !data) return;
    for (const item of data) {
      const full = path ? `${path}/${item.name}` : item.name;
      if (item.id === null || (item.metadata == null && !item.name.includes("."))) {
        await walk(full);
      } else {
        all.push(full);
      }
    }
  }
  await walk(prefix);
  return all;
}

async function wipeUserStorage(supabase: any, userId: string, sellerId: string | null) {
  let total = 0;
  for (const bucket of STORAGE_BUCKETS) {
    for (const prefix of [userId, sellerId].filter(Boolean) as string[]) {
      const paths = await listAllObjects(supabase, bucket, prefix);
      while (paths.length) {
        const batch = paths.splice(0, 100);
        await supabase.storage.from(bucket).remove(batch);
        total += batch.length;
      }
    }
  }
  return total;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "forbidden" }, 403);

    const body = await req.json();
    const action = body.action as string;
    const mode = (body.mode as string) || "preview";
    const days = Math.max(1, Number(body.days) || 60);
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

    // Helper: check if user is on a free/no-paid plan
    async function isFreeUser(uid: string): Promise<boolean> {
      const { data } = await admin
        .from("seller_subscriptions")
        .select("tier, is_active, expires_at")
        .eq("user_id", uid)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return true;
      if (FREE_TIERS.includes(data.tier as string)) return true;
      if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return true;
      return false;
    }

    if (action === "old_items") {
      // Free-tier users' items inactive/old
      const { data: items } = await admin
        .from("seller_items")
        .select("id, user_id, seller_id, photos, created_at, title")
        .lt("created_at", cutoff)
        .limit(5000);

      const candidates: any[] = [];
      for (const it of items ?? []) {
        if (await isFreeUser(it.user_id)) candidates.push(it);
      }

      if (mode === "preview") {
        return json({
          count: candidates.length,
          sample: candidates.slice(0, 20).map(i => ({ id: i.id, title: i.title, created_at: i.created_at })),
        });
      }

      let deletedPhotos = 0;
      for (const it of candidates) {
        const photos: string[] = it.photos || [];
        const paths = photos
          .map(url => {
            try {
              const u = new URL(url);
              const m = u.pathname.match(/\/object\/public\/([^/]+)\/(.+)/);
              return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null;
            } catch { return null; }
          })
          .filter(Boolean) as { bucket: string; path: string }[];
        const byBucket: Record<string, string[]> = {};
        for (const p of paths) (byBucket[p.bucket] ||= []).push(p.path);
        for (const [bucket, list] of Object.entries(byBucket)) {
          await admin.storage.from(bucket).remove(list);
          deletedPhotos += list.length;
        }
      }
      const ids = candidates.map(c => c.id);
      if (ids.length) await admin.from("seller_items").delete().in("id", ids);
      return json({ deleted_items: ids.length, deleted_photos: deletedPhotos });
    }

    if (action === "inactive_users") {
      // Use auth admin API to list users
      const candidates: any[] = [];
      let page = 1;
      while (page < 50) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error || !data?.users?.length) break;
        for (const u of data.users) {
          const last = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : new Date(u.created_at).getTime();
          if (last < Date.now() - days * 24 * 3600 * 1000) {
            if (await isFreeUser(u.id)) {
              candidates.push({ id: u.id, email: u.email, last_sign_in_at: u.last_sign_in_at, created_at: u.created_at });
            }
          }
        }
        if (data.users.length < 200) break;
        page++;
      }

      if (mode === "preview") {
        return json({ count: candidates.length, sample: candidates.slice(0, 30) });
      }

      let totalFiles = 0;
      for (const u of candidates) {
        const { data: prof } = await admin.from("profiles").select("id").eq("user_id", u.id).maybeSingle();
        const sellerId = prof?.id ?? null;
        totalFiles += await wipeUserStorage(admin, u.id, sellerId);
        if (sellerId) {
          await admin.from("seller_items").delete().eq("seller_id", sellerId);
          await admin.from("seller_stories").delete().eq("seller_id", sellerId);
        }
        await admin.from("profiles").delete().eq("user_id", u.id);
        await admin.auth.admin.deleteUser(u.id);
      }
      return json({ deleted_users: candidates.length, deleted_files: totalFiles });
    }

    if (action === "wipe_user") {
      const targetId = body.user_id as string;
      if (!targetId) return json({ error: "user_id required" }, 400);
      if (!(await isFreeUser(targetId))) return json({ error: "user has paid plan" }, 400);

      const { data: prof } = await admin.from("profiles").select("id").eq("user_id", targetId).maybeSingle();
      const sellerId = prof?.id ?? null;

      if (mode === "preview") {
        let count = 0;
        for (const bucket of STORAGE_BUCKETS) {
          for (const prefix of [targetId, sellerId].filter(Boolean) as string[]) {
            const list = await listAllObjects(admin, bucket, prefix);
            count += list.length;
          }
        }
        const { count: itemsCount } = await admin
          .from("seller_items")
          .select("*", { count: "exact", head: true })
          .eq("user_id", targetId);
        return json({ files: count, items: itemsCount ?? 0 });
      }

      const files = await wipeUserStorage(admin, targetId, sellerId);
      if (sellerId) {
        await admin.from("seller_items").delete().eq("seller_id", sellerId);
        await admin.from("seller_stories").delete().eq("seller_id", sellerId);
      }
      await admin.from("profiles").delete().eq("user_id", targetId);
      await admin.auth.admin.deleteUser(targetId);
      return json({ ok: true, deleted_files: files });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("admin-cleanup error", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
