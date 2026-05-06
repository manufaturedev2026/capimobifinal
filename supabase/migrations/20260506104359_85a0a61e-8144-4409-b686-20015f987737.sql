UPDATE public.push_subscriptions
SET scope = 'admin_home'
WHERE user_id IS NULL
  AND seller_id = (
    SELECT value::uuid FROM public.platform_settings WHERE key = 'admin_push_seller_id' LIMIT 1
  );