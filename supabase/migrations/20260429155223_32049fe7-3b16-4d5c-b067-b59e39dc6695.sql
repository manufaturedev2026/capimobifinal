CREATE TABLE IF NOT EXISTS public.plan_limit_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  seller_id uuid,
  limit_key text NOT NULL,           -- 'items' | 'photos' | 'storage' | 'visits'
  threshold integer NOT NULL,        -- 85, 100
  period_start date NOT NULL,        -- 1º dia do mês para idempotência
  current_value numeric,
  limit_value numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, limit_key, threshold, period_start)
);

CREATE INDEX IF NOT EXISTS idx_plan_limit_alerts_user ON public.plan_limit_alerts(user_id, period_start);

ALTER TABLE public.plan_limit_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage plan_limit_alerts"
  ON public.plan_limit_alerts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users see their own alerts"
  ON public.plan_limit_alerts FOR SELECT
  USING (auth.uid() = user_id);