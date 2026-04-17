-- Tabela de etapas do funil
CREATE TABLE public.funnel_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_offset INTEGER NOT NULL,
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(day_offset)
);

ALTER TABLE public.funnel_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage funnel steps"
ON public.funnel_steps FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_funnel_steps_updated_at
BEFORE UPDATE ON public.funnel_steps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de histórico de envios
CREATE TABLE public.funnel_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  user_id UUID NOT NULL,
  step_id UUID NOT NULL REFERENCES public.funnel_steps(id) ON DELETE CASCADE,
  day_offset INTEGER NOT NULL,
  to_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviado',
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, step_id)
);

ALTER TABLE public.funnel_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view funnel sends"
ON public.funnel_sends FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete funnel sends"
ON public.funnel_sends FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_funnel_sends_profile ON public.funnel_sends(profile_id);
CREATE INDEX idx_funnel_steps_active ON public.funnel_steps(is_active, day_offset);