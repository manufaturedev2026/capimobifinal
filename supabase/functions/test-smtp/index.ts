import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

    const { to } = await req.json();
    if (!to) return json({ error: "Missing 'to'" }, 400);

    const { data: settings } = await admin.from("smtp_settings").select("*").limit(1).maybeSingle();
    if (!settings) return json({ error: "SMTP não configurado" }, 400);
    if (!settings.enabled) return json({ error: "SMTP desativado" }, 400);
    if (!settings.password_encrypted) return json({ error: "Senha SMTP ausente" }, 400);

    const key = Deno.env.get("SMTP_ENCRYPTION_KEY") || "default-dev-key-change-me";
    const { data: pwd, error: decErr } = await admin.rpc("decrypt_smtp_password", { p_encrypted: settings.password_encrypted, p_key: key });
    if (decErr) throw decErr;

    const subject = "Teste de configuração SMTP — Capimobi";
    const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px"><h2 style="color:#0f172a">✅ SMTP funcionando!</h2><p>Este é um e-mail de teste enviado pelo painel administrativo.</p><p style="color:#64748b;font-size:13px">Servidor: ${settings.host}:${settings.port} (${settings.security})</p></div>`;

    let logStatus = "sent";
    let errorMessage: string | null = null;

    try {
      const client = new SMTPClient({
        connection: {
          hostname: settings.host,
          port: settings.port,
          tls: settings.security === "ssl",
          auth: { username: settings.username, password: pwd as string },
        },
      });
      await client.send({
        from: `${settings.sender_name} <${settings.sender_email}>`,
        to,
        subject,
        html,
        replyTo: settings.reply_to || undefined,
      });
      await client.close();

      await admin.from("smtp_settings").update({
        last_test_at: new Date().toISOString(),
        last_test_status: "success",
        last_test_error: null,
      }).eq("id", settings.id);
    } catch (e) {
      logStatus = "failed";
      errorMessage = (e as Error).message;
      await admin.from("smtp_settings").update({
        last_test_at: new Date().toISOString(),
        last_test_status: "error",
        last_test_error: errorMessage,
      }).eq("id", settings.id);
    }

    await admin.from("email_logs").insert({
      to_email: to,
      subject,
      message: html,
      status: logStatus,
      error_message: errorMessage,
      context: "smtp_test",
    });

    if (logStatus === "failed") return json({ ok: false, error: errorMessage });
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}
