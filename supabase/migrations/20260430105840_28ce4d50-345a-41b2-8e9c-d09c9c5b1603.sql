-- Tabela principal de pagamentos AppMax
CREATE TABLE IF NOT EXISTS public.appmax_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  tier TEXT NOT NULL,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  pix_qr_code TEXT,
  pix_emv TEXT,
  pix_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appmax_payments_user_id_idx ON public.appmax_payments(user_id);
CREATE INDEX IF NOT EXISTS appmax_payments_status_idx ON public.appmax_payments(status);

ALTER TABLE public.appmax_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON public.appmax_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all payments"
  ON public.appmax_payments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER appmax_payments_updated_at
  BEFORE UPDATE ON public.appmax_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de logs de webhook
CREATE TABLE IF NOT EXISTS public.appmax_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  order_id TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appmax_webhook_logs_order_id_idx ON public.appmax_webhook_logs(order_id);
CREATE INDEX IF NOT EXISTS appmax_webhook_logs_event_idx ON public.appmax_webhook_logs(event);

ALTER TABLE public.appmax_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view webhook logs"
  ON public.appmax_webhook_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));