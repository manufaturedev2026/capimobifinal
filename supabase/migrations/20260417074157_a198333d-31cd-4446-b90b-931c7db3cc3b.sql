
CREATE TABLE public.broadcast_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  content_html text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcast_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage broadcast templates"
  ON public.broadcast_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_broadcast_templates_updated_at
  BEFORE UPDATE ON public.broadcast_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.broadcast_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  to_email text NOT NULL,
  profile_id uuid,
  subject text NOT NULL,
  tier_filter text,
  status text NOT NULL DEFAULT 'enviado',
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcast_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view broadcast sends"
  ON public.broadcast_sends FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete broadcast sends"
  ON public.broadcast_sends FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
