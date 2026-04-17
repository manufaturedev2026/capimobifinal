-- Tabela principal de leads imobiliários
CREATE TABLE IF NOT EXISTS public.leads_imobiliarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo_lead TEXT NOT NULL DEFAULT 'imobiliaria', -- imobiliaria | corretor
  empresa TEXT,
  email TEXT,
  whatsapp TEXT,
  telefone TEXT,
  site TEXT,
  instagram TEXT,
  cidade TEXT,
  estado TEXT,
  endereco TEXT,
  cep TEXT,
  origem TEXT NOT NULL DEFAULT 'Apify',
  status TEXT NOT NULL DEFAULT 'novo', -- novo | contatado | qualificado | descartado | convertido
  rating NUMERIC,
  reviews_count INTEGER,
  google_place_id TEXT,
  apify_run_id TEXT,
  observacoes TEXT,
  raw_data JSONB,
  data_captacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_imob_email ON public.leads_imobiliarios (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_imob_telefone ON public.leads_imobiliarios (telefone) WHERE telefone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_imob_whatsapp ON public.leads_imobiliarios (whatsapp) WHERE whatsapp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_imob_cidade ON public.leads_imobiliarios (cidade);
CREATE INDEX IF NOT EXISTS idx_leads_imob_estado ON public.leads_imobiliarios (estado);
CREATE INDEX IF NOT EXISTS idx_leads_imob_tipo ON public.leads_imobiliarios (tipo_lead);
CREATE INDEX IF NOT EXISTS idx_leads_imob_status ON public.leads_imobiliarios (status);
CREATE INDEX IF NOT EXISTS idx_leads_imob_data ON public.leads_imobiliarios (data_captacao DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_imob_email ON public.leads_imobiliarios (lower(email)) WHERE email IS NOT NULL AND email <> '';
CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_imob_place ON public.leads_imobiliarios (google_place_id) WHERE google_place_id IS NOT NULL;

ALTER TABLE public.leads_imobiliarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage leads_imobiliarios"
  ON public.leads_imobiliarios FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_leads_imob_updated
  BEFORE UPDATE ON public.leads_imobiliarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Histórico de buscas Apify
CREATE TABLE IF NOT EXISTS public.apify_search_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tipo_lead TEXT NOT NULL DEFAULT 'ambos',
  estado TEXT,
  cidade TEXT,
  palavra_chave TEXT,
  quantidade_solicitada INTEGER NOT NULL DEFAULT 50,
  quantidade_retornada INTEGER NOT NULL DEFAULT 0,
  quantidade_importada INTEGER NOT NULL DEFAULT 0,
  quantidade_duplicada INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente | rodando | concluido | erro
  apify_run_id TEXT,
  actor_id TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_apify_runs_created ON public.apify_search_runs (created_at DESC);

ALTER TABLE public.apify_search_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage apify_search_runs"
  ON public.apify_search_runs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Campanhas de e-mail para leads
CREATE TABLE IF NOT EXISTS public.lead_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  segment_filter JSONB DEFAULT '{}'::jsonb, -- {tipo_lead, estado, cidade, status, has_email, has_whatsapp}
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'rascunho', -- rascunho | enviando | concluido | erro
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_campaigns_created ON public.lead_campaigns (created_at DESC);

ALTER TABLE public.lead_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lead_campaigns"
  ON public.lead_campaigns FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_lead_campaigns_updated
  BEFORE UPDATE ON public.lead_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Envios individuais
CREATE TABLE IF NOT EXISTS public.lead_campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.lead_campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads_imobiliarios(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente | enviado | erro
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_camp_sends_camp ON public.lead_campaign_sends (campaign_id);

ALTER TABLE public.lead_campaign_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lead_campaign_sends"
  ON public.lead_campaign_sends FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));