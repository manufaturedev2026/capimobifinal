import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let onlyProfileId: string | null = null;
    let onlyDayOffset: number | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.profile_id) onlyProfileId = String(body.profile_id);
        if (body?.day_offset !== undefined && body?.day_offset !== null) onlyDayOffset = Number(body.day_offset);
      } catch (_) { /* no body */ }
    }

    const { data: settings } = await admin.from("smtp_settings").select("*").limit(1).maybeSingle();
    if (!settings || !settings.enabled || !settings.password_encrypted) {
      return json({ error: "SMTP não configurado ou desativado" }, 400);
    }

    const key = Deno.env.get("SMTP_ENCRYPTION_KEY") || "default-dev-key-change-me";
    const { data: pwd } = await admin.rpc("decrypt_smtp_password", {
      p_encrypted: settings.password_encrypted,
      p_key: key,
    });

    const { data: steps } = await admin
      .from("funnel_steps")
      .select("*")
      .eq("is_active", true)
      .order("day_offset");

    if (!steps || steps.length === 0) return json({ ok: true, processed: 0, message: "Nenhuma etapa ativa" });

    const stepsFiltered = onlyDayOffset !== null
      ? steps.filter((s: any) => s.day_offset === onlyDayOffset)
      : steps;
    if (stepsFiltered.length === 0) return json({ ok: true, processed: 0, message: "Nenhuma etapa para o filtro" });

    let profilesQuery = admin
      .from("profiles")
      .select("id, user_id, full_name, email, created_at")
      .not("email", "is", null);
    if (onlyProfileId) profilesQuery = profilesQuery.eq("id", onlyProfileId);
    const { data: profiles } = await profilesQuery;

    if (!profiles) return json({ ok: true, processed: 0 });

    // Carrega lista de e-mails excluídos do funil
    const { data: excludedRows } = await admin
      .from("funnel_excluded_emails")
      .select("email");
    const excludedSet = new Set<string>(
      (excludedRows || []).map((r: any) => String(r.email).toLowerCase().trim())
    );

    let sent = 0, failed = 0, skipped = 0;
    const now = Date.now();

    const client = new SMTPClient({
      connection: {
        hostname: settings.host,
        port: settings.port,
        tls: settings.security === "ssl",
        auth: { username: settings.username, password: pwd as string },
      },
    });

    for (const profile of profiles) {
      // Pula e-mails excluídos do funil
      if (excludedSet.has(String(profile.email).toLowerCase().trim())) { skipped++; continue; }
      const ageDays = Math.floor((now - new Date(profile.created_at).getTime()) / 86400000);

      for (const step of stepsFiltered) {
        // When invoked directly with a profile_id, ignore age check (immediate send)
        if (!onlyProfileId && ageDays !== step.day_offset) continue;

        const { data: existing } = await admin
          .from("funnel_sends")
          .select("id")
          .eq("profile_id", profile.id)
          .eq("step_id", step.id)
          .maybeSingle();

        if (existing) { skipped++; continue; }

        const firstName = (profile.full_name || "").split(" ")[0] || "Corretor";
        const html = String(step.content_html)
          .replaceAll("{{nome}}", firstName)
          .replaceAll("{{nome_completo}}", profile.full_name || "")
          .replaceAll("{{email}}", profile.email);
        const subject = String(step.subject)
          .replaceAll("{{nome}}", firstName);

        try {
          await client.send({
            from: `${settings.sender_name} <${settings.sender_email}>`,
            to: profile.email,
            subject,
            html,
            replyTo: settings.reply_to || undefined,
          });

          await admin.from("funnel_sends").insert({
            profile_id: profile.id,
            user_id: profile.user_id,
            step_id: step.id,
            day_offset: step.day_offset,
            to_email: profile.email,
            status: "enviado",
          });
          await admin.from("email_logs").insert({
            to_email: profile.email, subject, message: html,
            status: "sent", context: `funnel_day_${step.day_offset}`,
          });
          sent++;
        } catch (e) {
          const msg = (e as Error).message;
          await admin.from("funnel_sends").insert({
            profile_id: profile.id,
            user_id: profile.user_id,
            step_id: step.id,
            day_offset: step.day_offset,
            to_email: profile.email,
            status: "falhou",
            error_message: msg,
          });
          await admin.from("email_logs").insert({
            to_email: profile.email, subject, message: html,
            status: "failed", error_message: msg, context: `funnel_day_${step.day_offset}`,
          });
          failed++;
        }
      }
    }

    await client.close();
    return json({ ok: true, sent, failed, skipped });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}
