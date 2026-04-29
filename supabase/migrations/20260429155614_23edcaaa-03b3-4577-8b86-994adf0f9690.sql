CREATE OR REPLACE FUNCTION public.is_seller_visit_blocked(p_seller_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_tier text := 'basico';
  v_limit integer;
  v_visits integer := 0;
BEGIN
  IF p_seller_id IS NULL THEN RETURN false; END IF;

  SELECT user_id INTO v_user_id FROM public.profiles WHERE id = p_seller_id LIMIT 1;
  IF v_user_id IS NULL THEN RETURN false; END IF;

  SELECT tier::text INTO v_tier
  FROM public.seller_subscriptions
  WHERE user_id = v_user_id AND is_active = true
  ORDER BY created_at DESC LIMIT 1;
  v_tier := COALESCE(v_tier, 'basico');

  SELECT monthly_visits_limit INTO v_limit
  FROM public.subscription_plans
  WHERE tier = v_tier AND is_active = true LIMIT 1;

  IF v_limit IS NULL OR v_limit <= 0 THEN RETURN false; END IF;

  SELECT count(*) INTO v_visits
  FROM public.seller_analytics
  WHERE seller_id = p_seller_id
    AND event_type IN ('view', 'profile_view', 'item_view')
    AND created_at >= date_trunc('month', now());

  -- Tolerância de 20% acima do limite contratado
  RETURN v_visits >= (v_limit * 1.2);
END;
$function$;