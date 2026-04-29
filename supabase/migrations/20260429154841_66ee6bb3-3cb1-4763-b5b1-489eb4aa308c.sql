CREATE OR REPLACE FUNCTION public.get_user_plan_usage(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_seller_id uuid;
  v_tier text := 'basico';
  v_plan record;
  v_active_items integer := 0;
  v_total_photos integer := 0;
  v_storage_mb numeric := 0;
  v_balance integer := 0;
  v_monthly_visits integer := 0;
BEGIN
  SELECT id INTO v_seller_id FROM public.profiles WHERE user_id = p_user_id LIMIT 1;

  SELECT tier::text INTO v_tier
  FROM public.seller_subscriptions
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  v_tier := COALESCE(v_tier, 'basico');

  SELECT max_items, max_photos_per_listing, storage_mb, ai_credits_per_month, monthly_visits_limit, name
  INTO v_plan
  FROM public.subscription_plans
  WHERE tier = v_tier AND is_active = true
  LIMIT 1;

  IF v_seller_id IS NOT NULL THEN
    SELECT count(*), COALESCE(SUM(coalesce(array_length(photos,1),0)), 0)
    INTO v_active_items, v_total_photos
    FROM public.seller_items
    WHERE seller_id = v_seller_id AND status = 'ativo';

    v_storage_mb := (v_total_photos * 0.3);

    SELECT count(*) INTO v_monthly_visits
    FROM public.seller_analytics
    WHERE seller_id = v_seller_id
      AND event_type IN ('view', 'profile_view', 'item_view')
      AND created_at >= date_trunc('month', now());
  END IF;

  SELECT balance INTO v_balance
  FROM public.ai_credit_wallets
  WHERE user_id = p_user_id
  LIMIT 1;

  RETURN jsonb_build_object(
    'tier', v_tier,
    'plan_name', COALESCE(v_plan.name, 'Básico'),
    'usage', jsonb_build_object(
      'active_items', v_active_items,
      'total_photos', v_total_photos,
      'storage_mb', round(v_storage_mb, 2),
      'ai_credits_balance', COALESCE(v_balance, 0),
      'monthly_visits', COALESCE(v_monthly_visits, 0)
    ),
    'limits', jsonb_build_object(
      'max_items', COALESCE(v_plan.max_items, 3),
      'max_photos_per_listing', COALESCE(v_plan.max_photos_per_listing, 5),
      'storage_mb', COALESCE(v_plan.storage_mb, 15),
      'ai_credits_per_month', COALESCE(v_plan.ai_credits_per_month, 25),
      'monthly_visits_limit', COALESCE(v_plan.monthly_visits_limit, 3000)
    )
  );
END;
$function$;