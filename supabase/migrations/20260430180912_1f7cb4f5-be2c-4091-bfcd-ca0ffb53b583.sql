ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_seller_user ON public.push_subscriptions(seller_id, user_id);