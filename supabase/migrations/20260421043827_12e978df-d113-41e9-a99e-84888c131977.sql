
-- Multi-bots de captação por corretor (igual modelo dos agenda_bots)
CREATE TABLE public.capture_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  user_id UUID NOT NULL,
  bot_type TEXT NOT NULL DEFAULT 'captacao' CHECK (bot_type IN ('captacao','grupo','avaliacao')),
  slug TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Bot de Captação',
  attendant_name TEXT NOT NULL DEFAULT 'Assistente Imobiliário',
  attendant_avatar TEXT,
  opening_message TEXT,
  success_cta_label TEXT NOT NULL DEFAULT '💬 Falar no WhatsApp',
  success_cta_url TEXT,
  whatsapp_group_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seller_id, slug)
);

CREATE INDEX idx_capture_bots_seller ON public.capture_bots(seller_id);
CREATE INDEX idx_capture_bots_slug ON public.capture_bots(slug);

ALTER TABLE public.capture_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active capture bots" ON public.capture_bots
  FOR SELECT USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Owners can insert capture bots" ON public.capture_bots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update capture bots" ON public.capture_bots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete capture bots" ON public.capture_bots
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all capture bots" ON public.capture_bots
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_capture_bots_updated_at BEFORE UPDATE ON public.capture_bots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrar config existente (capture_bot_config_*) para um bot 'captacao' padrão por seller
INSERT INTO public.capture_bots (seller_id, user_id, bot_type, slug, name, attendant_name, attendant_avatar, opening_message, success_cta_label, success_cta_url)
SELECT
  p.id AS seller_id,
  p.user_id,
  'captacao',
  'captacao',
  'Bot de Captação',
  COALESCE(NULLIF(ps.value::jsonb->>'attendantName',''), 'Assistente Imobiliário'),
  NULLIF(ps.value::jsonb->>'attendantAvatar',''),
  NULLIF(ps.value::jsonb->>'openingMessage',''),
  COALESCE(NULLIF(ps.value::jsonb->>'captacaoCtaLabel',''), '💬 Falar no WhatsApp'),
  NULLIF(ps.value::jsonb->>'captacaoCtaUrl','')
FROM public.platform_settings ps
JOIN public.profiles p ON ps.key = 'capture_bot_config_' || p.id::text
WHERE ps.key LIKE 'capture_bot_config_%'
ON CONFLICT (seller_id, slug) DO NOTHING;
