CREATE OR REPLACE FUNCTION public.get_ai_monthly_credits_for_tier(p_tier text)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE COALESCE(p_tier, 'basico')
    WHEN 'basico' THEN 50
    WHEN 'basico_empresa' THEN 50
    WHEN 'start' THEN 500
    WHEN 'premium' THEN 1200
    WHEN 'vip' THEN 2000
    WHEN 'essencial_empresa' THEN 4000
    WHEN 'premium_empresa' THEN 4000
    WHEN 'prime_empresa' THEN 3500
    ELSE 50
  END
$function$;

UPDATE public.ai_credit_wallets w
SET monthly_plan_credits = 3500,
    updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.seller_subscriptions s
  WHERE s.user_id = w.user_id
    AND s.is_active = true
    AND s.tier = 'prime_empresa'
);