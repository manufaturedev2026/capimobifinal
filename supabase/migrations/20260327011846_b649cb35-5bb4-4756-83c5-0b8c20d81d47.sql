
UPDATE public.seller_subscriptions SET is_active = false WHERE id = 'd92d6007-df3a-4423-8978-6799dfdc55a2';

INSERT INTO public.seller_subscriptions (user_id, seller_id, tier, max_items, expires_at, payment_method, payment_status, is_active)
VALUES ('fde894a3-edac-4595-9adf-71791c36a237', 'e31c6331-696f-47c8-b8ed-cc63e397f0aa', 'premium', 15, now() + interval '30 days', 'admin', 'confirmado', true);
