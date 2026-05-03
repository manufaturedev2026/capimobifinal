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
    const { subject, content_html, tiers, test_email, custom_emails } = body as {
      subject: string;
      content_html: string;
      tiers: string[];
      test_email?: string;
      custom_emails?: string[];
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

    // Validate tiers + custom emails
    // Supports formats: "user@x.com", "Nome <user@x.com>", "Nome,user@x.com"
    const safeTiers = (tiers || []).filter((t) => ALLOWED_TIERS.includes(t));
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const customNameByEmail = new Map<string, string>();
    const customList: string[] = [];
    for (const raw of (custom_emails || [])) {
      const s = String(raw).trim();
      if (!s) continue;
      let name = "";
      let email = "";
      const m = s.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
      if (m) {
        name = m[1].trim().replace(/^["']|["']$/g, "");
        email = m[2].trim().toLowerCase();
      } else if (s.includes(",")) {
        const parts = s.split(",").map((p) => p.trim());
        const emailPart = parts.find((p) => emailRe.test(p.toLowerCase())) || "";
        email = emailPart.toLowerCase();
        name = parts.filter((p) => p !== emailPart).join(" ").trim();
      } else {
        email = s.toLowerCase();
      }
      if (!emailRe.test(email)) continue;
      if (!customList.includes(email)) customList.push(email);
      if (name && !customNameByEmail.has(email)) customNameByEmail.set(email, name);
    }
    if (safeTiers.length === 0 && customList.length === 0) {
      return json({ error: "Selecione um plano ou informe e-mails personalizados" }, 400);
    }

    type Recipient = { email: string; full_name: string | null; profile_id: string | null };
    let recipients: Recipient[] = [];

    if (safeTiers.length > 0) {
      const { data: subs } = await admin
        .from("seller_subscriptions")
        .select("user_id, tier")
        .eq("is_active", true)
        .in("tier", safeTiers);

      const userIds = Array.from(new Set((subs || []).map((s: any) => s.user_id)));
      let profileQuery = admin.from("profiles").select("id, user_id, full_name, email").not("email", "is", null);
      if (!safeTiers.includes("basico")) {
        profileQuery = profileQuery.in("user_id", userIds);
      }
      const { data: profiles } = await profileQuery;

      const tierByUser: Record<string, string> = {};
      for (const s of subs || []) tierByUser[(s as any).user_id] = (s as any).tier;

      recipients = (profiles || [])
        .filter((p: any) => safeTiers.includes(tierByUser[p.user_id] || "basico"))
        .map((p: any) => ({ email: p.email, full_name: p.full_name, profile_id: p.id }));
    }

    // Add custom emails (try to enrich with profile name if exists)
    if (customList.length > 0) {
      const { data: matched } = await admin
        .from("profiles")
        .select("id, full_name, email")
        .in("email", customList);
      const map = new Map((matched || []).map((p: any) => [String(p.email).toLowerCase(), p]));
      const existing = new Set(recipients.map((r) => r.email.toLowerCase()));
      for (const em of customList) {
        if (existing.has(em)) continue;
        const p = map.get(em);
        const fallbackName = customNameByEmail.get(em) || null;
        recipients.push({ email: em, full_name: p?.full_name || fallbackName, profile_id: p?.id || null });
      }
    }

    if (recipients.length === 0) {
      await client.close();
      return json({ ok: true, sent: 0, failed: 0, message: "Nenhum destinatário encontrado" });
    }

    let sent = 0, failed = 0;
    const tierLabel = [...safeTiers, ...(customList.length ? ["custom"] : [])].join(",");

    // Process in background to avoid 150s timeout
    const processInBackground = async () => {
      for (const profile of recipients) {
        const firstName = (profile.full_name || "").split(" ")[0] || "Olá";
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
            batch_id: batchId, to_email: profile.email, profile_id: profile.profile_id,
            subject: subj, tier_filter: tierLabel, status: "enviado",
          });
          sent++;
        } catch (e) {
          const msg = (e as Error).message;
          await admin.from("broadcast_sends").insert({
            batch_id: batchId, to_email: profile.email, profile_id: profile.profile_id,
            subject: subj, tier_filter: tierLabel, status: "falhou", error_message: msg,
          });
          failed++;
        }
      }
      try { await client.close(); } catch (_) {}
      console.log(`Broadcast ${batchId} done: sent=${sent} failed=${failed}`);
    };

    // @ts-ignore EdgeRuntime is available in Supabase Edge runtime
    EdgeRuntime.waitUntil(processInBackground());

    return json({ ok: true, queued: true, batch_id: batchId, total: recipients.length });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}
