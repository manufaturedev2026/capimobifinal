
ALTER TABLE public.seller_subscriptions
ADD COLUMN IF NOT EXISTS payment_reference text;

CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_payment_reference
ON public.seller_subscriptions(payment_reference)
WHERE payment_reference IS NOT NULL;
