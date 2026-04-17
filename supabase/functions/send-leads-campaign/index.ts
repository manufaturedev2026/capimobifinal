import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}

interface CampaignBody {
  campaign_id?: string;
  name?: string;
  subject: string;
  content_html: string;
  segment_filter?: {
    tipo_lead?: string;
    estado?: string;
    cidade?: string;
    status?: string;
    has_whatsapp?: boolean;
  };
  test_email?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(token);
    if (!userData.user) return json({ error: "Não autenticado" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Acesso negado" }, 403);

    const body = (await req.json()) as CampaignBody;
    if (!body.subject || !body.content_html) return json({ error: "Assunto e conteúdo obrigatórios" }, 400);

    // SMTP
    const { data: settings } = await admin.from("smtp_settings").select("*").limit(1).maybeSingle();
    if (!settings || !settings.enabled || !settings.password_encrypted) {
      return json({ error: "SMTP não configurado ou desativado" }, 400);
    }
    const key = Deno.env.get("SMTP_ENCRYPTION_KEY") || "default-dev-key-change-me";
    const { data: pwd } = await admin.rpc("decrypt_smtp_password", {
      p_encrypted: settings.password_encrypted, p_key: key,
    });

    const client = new SMTPClient({
      connection: {
        hostname: settings.host, port: settings.port,
        tls: settings.security === "ssl",
        auth: { username: settings.username, password: pwd as string },
      },
    });

    // Test mode
    if (body.test_email) {
      try {
        await client.send({
          from: `${settings.sender_name} <${settings.sender_email}>`,
          to: body.test_email,
          subject: String(body.subject).replaceAll("{{nome}}", "Teste"),
          html: String(body.content_html).replaceAll("{{nome}}", "Teste").replaceAll("{{empresa}}", "Empresa Teste"),
          replyTo: settings.reply_to || undefined,
        });
        await client.close();
        return json({ ok: true, test: true });
      } catch (e) {
        await client.close();
        return json({ error: (e as Error).message }, 500);
      }
    }

    // Build query
    let q = admin.from("leads_imobiliarios").select("id, nome, empresa, email, cidade, estado").not("email", "is", null);
    const f = body.segment_filter || {};
    if (f.tipo_lead && f.tipo_lead !== "todos") q = q.eq("tipo_lead", f.tipo_lead);
    if (f.estado) q = q.eq("estado", f.estado);
    if (f.cidade) q = q.eq("cidade", f.cidade);
    if (f.status && f.status !== "todos") q = q.eq("status", f.status);
    if (f.has_whatsapp) q = q.not("whatsapp", "is", null);
    // Always exclude leads already contacted/qualified/converted unless explicitly requested
    if (!f.status || f.status === "todos" || f.status === "novo") {
      q = q.eq("status", "novo");
    }

    const { data: leads, error: leadsErr } = await q.limit(5000);
    if (leadsErr) throw leadsErr;
    if (!leads || leads.length === 0) {
      await client.close();
      return json({ ok: true, sent: 0, failed: 0, message: "Nenhum lead encontrado" });
    }

    // Create or update campaign
    let campaignId = body.campaign_id;
    if (!campaignId) {
      const { data: camp, error: cerr } = await admin.from("lead_campaigns").insert({
        user_id: userData.user.id,
        name: body.name || body.subject,
        subject: body.subject,
        content_html: body.content_html,
        segment_filter: f,
        total_recipients: leads.length,
        status: "enviando",
        started_at: new Date().toISOString(),
      }).select().single();
      if (cerr) throw cerr;
      campaignId = camp.id;
    } else {
      await admin.from("lead_campaigns").update({
        status: "enviando", total_recipients: leads.length, started_at: new Date().toISOString(),
      }).eq("id", campaignId);
    }

    let sent = 0, failed = 0;

    for (const lead of leads) {
      const firstName = (lead.nome || "").split(" ")[0] || "Olá";
      const html = String(body.content_html)
        .replaceAll("{{nome}}", firstName)
        .replaceAll("{{empresa}}", lead.empresa || lead.nome || "")
        .replaceAll("{{cidade}}", lead.cidade || "")
        .replaceAll("{{estado}}", lead.estado || "");
      const subj = String(body.subject).replaceAll("{{nome}}", firstName).replaceAll("{{empresa}}", lead.empresa || "");

      try {
        await client.send({
          from: `${settings.sender_name} <${settings.sender_email}>`,
          to: lead.email!, subject: subj, html,
          replyTo: settings.reply_to || undefined,
        });
        await admin.from("lead_campaign_sends").insert({
          campaign_id: campaignId, lead_id: lead.id, to_email: lead.email!, status: "enviado",
        });
        sent++;
      } catch (e) {
        await admin.from("lead_campaign_sends").insert({
          campaign_id: campaignId, lead_id: lead.id, to_email: lead.email!,
          status: "erro", error_message: (e as Error).message,
        });
        failed++;
      }
    }

    await client.close();

    await admin.from("lead_campaigns").update({
      status: "concluido", sent_count: sent, failed_count: failed,
      finished_at: new Date().toISOString(),
    }).eq("id", campaignId);

    return json({ ok: true, campaign_id: campaignId, sent, failed, total: leads.length });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
