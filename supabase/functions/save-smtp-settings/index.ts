import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supaUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await supaUser.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const key = Deno.env.get("SMTP_ENCRYPTION_KEY") || "default-dev-key-change-me";

    let password_encrypted: string | null | undefined = undefined;
    if (body.password !== undefined && body.password !== null && body.password !== "") {
      const { data: enc, error: encErr } = await admin.rpc("encrypt_smtp_password", { p_password: body.password, p_key: key });
      if (encErr) throw encErr;
      password_encrypted = enc as string;
    }

    const { data: existing } = await admin.from("smtp_settings").select("id").limit(1).maybeSingle();

    const payload: Record<string, unknown> = {
      enabled: body.enabled,
      sender_name: body.sender_name || "",
      sender_email: body.sender_email || "",
      host: body.host || "",
      port: body.port || 465,
      security: body.security || "ssl",
      username: body.username || "",
      reply_to: body.reply_to || null,
      use_for_signup: body.use_for_signup ?? true,
      use_for_recovery: body.use_for_recovery ?? true,
    };
    if (password_encrypted !== undefined) payload.password_encrypted = password_encrypted;

    if (existing) {
      const { error } = await admin.from("smtp_settings").update(payload).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await admin.from("smtp_settings").insert(payload);
      if (error) throw error;
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}
