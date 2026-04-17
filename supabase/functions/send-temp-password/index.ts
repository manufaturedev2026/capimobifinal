import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateTempPassword(len = 10): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const nums = "23456789";
  const sym = "!@#$%&*";
  const all = upper + lower + nums + sym;
  let pwd = "";
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += nums[Math.floor(Math.random() * nums.length)];
  pwd += sym[Math.floor(Math.random() * sym.length)];
  for (let i = pwd.length; i < len; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") return json({ error: "E-mail obrigatório" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find user by email via profiles
    const { data: profile } = await admin
      .from("profiles")
      .select("id, user_id, full_name, email")
      .ilike("email", email.trim())
      .maybeSingle();

    // Always respond OK to avoid email enumeration
    if (!profile?.user_id) {
      return json({ ok: true });
    }

    const tempPwd = generateTempPassword(10);

    // Update password via admin
    const { error: updErr } = await admin.auth.admin.updateUserById(profile.user_id, {
      password: tempPwd,
    });
    if (updErr) {
      console.error("Erro ao atualizar senha:", updErr);
      return json({ error: "Falha ao gerar senha temporária" }, 500);
    }

    // Force password change on next login
    await admin.from("profiles").update({ must_change_password: true }).eq("id", profile.id);

    // Load SMTP settings
    const { data: settings } = await admin.from("smtp_settings").select("*").limit(1).maybeSingle();
    if (!settings || !settings.enabled || !settings.password_encrypted) {
      return json({ error: "SMTP não configurado" }, 400);
    }

    const key = Deno.env.get("SMTP_ENCRYPTION_KEY") || "default-dev-key-change-me";
    const { data: pwd, error: decErr } = await admin.rpc("decrypt_smtp_password", {
      p_encrypted: settings.password_encrypted,
      p_key: key,
    });
    if (decErr) throw decErr;

    const subject = "Sua senha temporária — Capimobi";
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <tr><td style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:32px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px">
            <span style="color:#ffffff">Cap</span><span style="color:#fbbf24">i</span><span style="color:#ffffff">mobi</span>
          </h1>
        </td></tr>
        <tr><td style="padding:40px 32px">
          <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px">Olá, ${(profile.full_name || "").split(" ")[0] || "tudo bem"}!</h2>
          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6">
            Você solicitou a recuperação da sua senha. Geramos uma <strong>senha temporária</strong> para você acessar sua conta:
          </p>
          <div style="background:#f8fafc;border:2px dashed #1e40af;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
            <div style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Sua senha temporária</div>
            <div style="font-family:'Courier New',monospace;font-size:28px;font-weight:bold;color:#1e40af;letter-spacing:3px">${tempPwd}</div>
          </div>
          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6">
            Use essa senha para entrar. <strong>No primeiro login você será obrigado(a) a criar uma nova senha</strong> e a temporária deixará de funcionar.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="https://capimobi.com.br/login" style="display:inline-block;background:#1e40af;color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px">Acessar minha conta</a>
          </td></tr></table>
          <p style="margin:32px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:20px">
            ⚠️ Se você não solicitou esta recuperação, entre em contato conosco imediatamente — sua conta pode ter sido comprometida.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px;text-align:center;color:#94a3b8;font-size:12px">
          © Capimobi — Plataforma profissional de imóveis
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
      to: email.trim(),
      subject,
      html,
      replyTo: settings.reply_to || undefined,
    });
    await client.close();

    await admin.from("email_logs").insert({
      to_email: email.trim(),
      subject,
      message: "Senha temporária enviada",
      status: "sent",
      context: "temp_password",
    });

    return json({ ok: true });
  } catch (e) {
    console.error("send-temp-password erro:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
