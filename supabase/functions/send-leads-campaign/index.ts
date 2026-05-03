import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEND_DELAY_MS = 70_000;
const SMTP_RATE_LIMIT_RETRY_MS = 10 * 60_000;
const MAX_RUNTIME_MS = 120_000; // stay under 150s edge timeout

const isRateLimitError = (msg: string) =>
  /rate\s*limit|ratelimit|hostinger_out_ratelimit|451|4\.7\.1|connection not recoverable|datamode|too many/i.test(msg || "");

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}

async function safeClose(client: SMTPClient) {
  try {
    await client.close();
  } catch (_) {
    // Connection may already be unusable after Hostinger closes it in datamode.
  }
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
  max_recipients?: number;
  lead_ids?: string[];
  skip_already_sent?: boolean;
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

    // Build query — either by IDs or by segment
    let leads: Array<{ id: string; nome: string | null; empresa: string | null; email: string | null; cidade: string | null; estado: string | null }> = [];

    if (body.lead_ids && body.lead_ids.length > 0) {
      const { data, error } = await admin
        .from("leads_imobiliarios")
        .select("id, nome, empresa, email, cidade, estado")
        .in("id", body.lead_ids)
        .not("email", "is", null);
      if (error) throw error;
      leads = (data || []) as typeof leads;
    } else {
      let q = admin.from("leads_imobiliarios").select("id, nome, empresa, email, cidade, estado").not("email", "is", null);
      const f = body.segment_filter || {};
      if (f.tipo_lead && f.tipo_lead !== "todos") q = q.eq("tipo_lead", f.tipo_lead);
      if (f.estado) q = q.eq("estado", f.estado);
      if (f.cidade) q = q.eq("cidade", f.cidade);
      if (f.status && f.status !== "todos") q = q.eq("status", f.status);
      if (f.has_whatsapp) q = q.not("whatsapp", "is", null);
      if (!f.status || f.status === "todos" || f.status === "novo") {
        q = q.eq("status", "novo");
      }
      const { data, error } = await q.limit(5000);
      if (error) throw error;
      leads = (data || []) as typeof leads;
    }

    // Skip already-sent leads (by default true)
    const skipSent = body.skip_already_sent !== false;
    if (skipSent && leads.length > 0) {
      const ids = leads.map((l) => l.id);
      const { data: prevSends } = await admin
        .from("lead_campaign_sends")
        .select("lead_id")
        .in("lead_id", ids)
        .eq("status", "enviado");
      const sentSet = new Set((prevSends || []).map((r: any) => r.lead_id));
      leads = leads.filter((l) => !sentSet.has(l.id));
    }

    // Apply max_recipients limit
    if (body.max_recipients && body.max_recipients > 0 && leads.length > body.max_recipients) {
      leads = leads.slice(0, body.max_recipients);
    }

    if (leads.length === 0) {
      await client.close();
      return json({ ok: true, sent: 0, failed: 0, total: 0, message: "Nenhum lead disponível para envio (todos já receberam ou nenhum encontrado)." });
    }

    // Create or update campaign
    let campaignId = body.campaign_id;
    if (!campaignId) {
      const { data: camp, error: cerr } = await admin.from("lead_campaigns").insert({
        user_id: userData.user.id,
        name: body.name || body.subject,
        subject: body.subject,
        content_html: body.content_html,
        segment_filter: body.segment_filter || {},
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
    let rateLimited = false;
    const SEND_DELAY_MS = 70_000;
    const MAX_RUNTIME_MS = 120_000; // stay under 150s edge timeout
    const startedAt = Date.now();
    let timedOut = false;
    const isRateLimitError = (msg: string) =>
      /rate\s*limit|hostinger_out_ratelimit|4\.7\.1|connection not recoverable|datamode|too many/i.test(msg || "");

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
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
        await admin.from("leads_imobiliarios")
          .update({ status: "contatado", ultima_atualizacao: new Date().toISOString() })
          .eq("id", lead.id);
        sent++;
      } catch (e) {
        await admin.from("lead_campaign_sends").insert({
          campaign_id: campaignId, lead_id: lead.id, to_email: lead.email!,
          status: "erro", error_message: (e as Error).message,
        });
        failed++;
        if (isRateLimitError((e as Error).message)) {
          rateLimited = true;
          break;
        }
      }
      if (i < leads.length - 1) {
        if (Date.now() - startedAt + SEND_DELAY_MS > MAX_RUNTIME_MS) {
          timedOut = true;
          break;
        }
        await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
      }
    }

    await client.close();

    await admin.from("lead_campaigns").update({
      status: (rateLimited || timedOut) ? "pausado" : "concluido", sent_count: sent, failed_count: failed,
      finished_at: new Date().toISOString(),
    }).eq("id", campaignId);

    return json({
      ok: true,
      campaign_id: campaignId,
      sent,
      failed,
      total: leads.length,
      rate_limited: rateLimited,
      partial: timedOut,
      message: rateLimited
        ? "Limite de envio do SMTP atingido. Aguarde ~10 minutos e clique em Enviar novamente para continuar (já enviados são pulados automaticamente)."
        : timedOut
        ? `Lote parcial enviado (${sent}). Clique em Enviar novamente para continuar do próximo lead (já enviados são pulados).`
        : undefined,
    });
  } catch (e) {
    const msg = (e as Error).message || "";
    const isRate = /rate\s*limit|hostinger_out_ratelimit|4\.7\.1|connection not recoverable|datamode|too many/i.test(msg);
    return json({ error: msg, rate_limited: isRate }, isRate ? 200 : 500);
  }
});
