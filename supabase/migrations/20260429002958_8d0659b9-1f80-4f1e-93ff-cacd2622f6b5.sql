CREATE OR REPLACE FUNCTION public.get_ai_monthly_credits_for_tier(p_tier text)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE COALESCE(p_tier, 'basico')
    WHEN 'basico' THEN 25
    WHEN 'basico_empresa' THEN 25
    WHEN 'start' THEN 250
    WHEN 'premium' THEN 600
    WHEN 'vip' THEN 1000
    WHEN 'essencial_empresa' THEN 2000
    WHEN 'premium_empresa' THEN 2000
    WHEN 'prime_empresa' THEN 3500
    ELSE 25
  END
$function$;

UPDATE public.ai_credit_wallets w
SET monthly_plan_credits = public.get_ai_monthly_credits_for_tier(s.tier::text),
    updated_at = now()
FROM public.seller_subscriptions s
WHERE s.user_id = w.user_id
  AND s.is_active = true
  AND w.monthly_plan_credits IS DISTINCT FROM public.get_ai_monthly_credits_for_tier(s.tier::text);