CREATE TABLE IF NOT EXISTS public.funnel_excluded_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  reason text,
  excluded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.funnel_excluded_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage funnel exclusions"
ON public.funnel_excluded_emails
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_funnel_excluded_emails_email ON public.funnel_excluded_emails (lower(email));