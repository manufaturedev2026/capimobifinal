ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'store';

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_seller_scope
  ON public.push_subscriptions (seller_id, scope);