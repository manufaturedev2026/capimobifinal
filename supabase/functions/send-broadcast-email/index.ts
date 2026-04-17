import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_TIERS = ["start", "basico", "premium", "vip", "essencial_empresa", "premium_empresa", "prime_empresa", "black"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Auth: require admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(token);
    if (!userData.user) return json({ error: "Não autenticado" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Acesso negado" }, 403);

    const body = await req.json();
    const { subject, content_html, tiers, test_email } = body as {
      subject: string;
      content_html: string;
      tiers: string[];
      test_email?: string;
    };

    if (!subject || !content_html) return json({ error: "Assunto e conteúdo obrigatórios" }, 400);

    // Load SMTP
    const { data: settings } = await admin.from("smtp_settings").select("*").limit(1).maybeSingle();
    if (!settings || !settings.enabled || !settings.password_encrypted) {
      return json({ error: "SMTP não configurado ou desativado" }, 400);
    }
    const key = Deno.env.get("SMTP_ENCRYPTION_KEY") || "default-dev-key-change-me";
    const { data: pwd } = await admin.rpc("decrypt_smtp_password", {
      p_encrypted: settings.password_encrypted,
      p_key: key,
    });

    const client = new SMTPClient({
      connection: {
        hostname: settings.host,
        port: settings.port,
        tls: settings.security === "ssl",
        auth: { username: settings.username, password: pwd as string },
      },
    });

    const batchId = crypto.randomUUID();

    // TEST MODE: send single email to test_email
    if (test_email) {
      const html = String(content_html).replaceAll("{{nome}}", "Teste");
      const subj = String(subject).replaceAll("{{nome}}", "Teste");
      try {
        await client.send({
          from: `${settings.sender_name} <${settings.sender_email}>`,
          to: test_email,
          subject: subj,
          html,
          replyTo: settings.reply_to || undefined,
        });
        await client.close();
        return json({ ok: true, test: true, sent: 1 });
      } catch (e) {
        await client.close();
        return json({ error: (e as Error).message }, 500);
      }
    }

    // Validate tiers
    const safeTiers = (tiers || []).filter((t) => ALLOWED_TIERS.includes(t));
    if (safeTiers.length === 0) return json({ error: "Selecione ao menos um plano" }, 400);

    // Get active subscriptions matching tiers
    const { data: subs } = await admin
      .from("seller_subscriptions")
      .select("user_id, tier")
      .eq("is_active", true)
      .in("tier", safeTiers);

    const userIds = Array.from(new Set((subs || []).map((s: any) => s.user_id)));

    // Profiles without active subscription = basico (free)
    let profileQuery = admin.from("profiles").select("id, user_id, full_name, email").not("email", "is", null);
    if (!safeTiers.includes("basico")) {
      profileQuery = profileQuery.in("user_id", userIds);
    }
    const { data: profiles } = await profileQuery;

    if (!profiles || profiles.length === 0) {
      await client.close();
      return json({ ok: true, sent: 0, failed: 0, message: "Nenhum destinatário encontrado" });
    }

    // Build tier map
    const tierByUser: Record<string, string> = {};
    for (const s of subs || []) tierByUser[(s as any).user_id] = (s as any).tier;

    // Filter by tier (basico if no sub)
    const recipients = profiles.filter((p: any) => {
      const tier = tierByUser[p.user_id] || "basico";
      return safeTiers.includes(tier);
    });

    let sent = 0, failed = 0;
    const tierLabel = safeTiers.join(",");

    for (const profile of recipients) {
      const firstName = (profile.full_name || "").split(" ")[0] || "Corretor";
      const html = String(content_html)
        .replaceAll("{{nome}}", firstName)
        .replaceAll("{{nome_completo}}", profile.full_name || "")
        .replaceAll("{{email}}", profile.email);
      const subj = String(subject).replaceAll("{{nome}}", firstName);

      try {
        await client.send({
          from: `${settings.sender_name} <${settings.sender_email}>`,
          to: profile.email,
          subject: subj,
          html,
          replyTo: settings.reply_to || undefined,
        });
        await admin.from("broadcast_sends").insert({
          batch_id: batchId, to_email: profile.email, profile_id: profile.id,
          subject: subj, tier_filter: tierLabel, status: "enviado",
        });
        sent++;
      } catch (e) {
        const msg = (e as Error).message;
        await admin.from("broadcast_sends").insert({
          batch_id: batchId, to_email: profile.email, profile_id: profile.id,
          subject: subj, tier_filter: tierLabel, status: "falhou", error_message: msg,
        });
        failed++;
      }
    }

    await client.close();
    return json({ ok: true, sent, failed, batch_id: batchId, total: recipients.length });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}
