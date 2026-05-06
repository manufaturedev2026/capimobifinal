
-- Function to deactivate expired subscriptions automatically
CREATE OR REPLACE FUNCTION public.deactivate_expired_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.seller_subscriptions
  SET is_active = false, updated_at = now()
  WHERE is_active = true AND expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Tier rank helper (higher = more powerful) for picking effective tier
CREATE OR REPLACE FUNCTION public.tier_rank(p_tier text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE COALESCE(p_tier, 'basico')
    WHEN 'basico' THEN 0
    WHEN 'imob_basico' THEN 0
    WHEN 'const_basico' THEN 0
    WHEN 'basico_empresa' THEN 0
    WHEN 'start' THEN 10
    WHEN 'imob_start' THEN 30
    WHEN 'const_start' THEN 40
    WHEN 'premium' THEN 20
    WHEN 'fundador_corretor' THEN 25
    WHEN 'vip' THEN 28
    WHEN 'prime' THEN 35
    WHEN 'imob_pro' THEN 50
    WHEN 'const_pro' THEN 55
    WHEN 'imob_elite' THEN 70
    WHEN 'const_master' THEN 80
    WHEN 'essencial_empresa' THEN 45
    WHEN 'fundador_empresa' THEN 50
    WHEN 'fundador_construtora' THEN 60
    WHEN 'premium_empresa' THEN 65
    WHEN 'prime_empresa' THEN 90
    ELSE 0
  END
$$;

-- Aggregated effective plan limits across all active, non-expired subscriptions
CREATE OR REPLACE FUNCTION public.get_effective_plan_limits(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subs jsonb := '[]'::jsonb;
  v_max_items integer := 0;
  v_max_photos integer := 0;
  v_storage_mb integer := 0;
  v_ai_credits integer := 0;
  v_visits integer := 0;
  v_team integer := 0;
  v_effective_tier text := 'basico';
  v_effective_rank integer := -1;
  v_count integer := 0;
  r record;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('subscriptions', v_subs, 'aggregate', '{}'::jsonb, 'effective_tier', 'basico', 'count', 0);
  END IF;

  FOR r IN
    SELECT s.id, s.tier::text AS tier, s.expires_at, s.started_at, s.billing_period,
           sp.name, sp.max_items, sp.max_photos_per_listing, sp.storage_mb,
           sp.ai_credits_per_month, sp.monthly_visits_limit,
           COALESCE(sp.max_team_members, 0) AS max_team_members
    FROM public.seller_subscriptions s
    LEFT JOIN public.subscription_plans sp ON sp.tier = s.tier::text AND sp.is_active = true
    WHERE s.user_id = p_user_id
      AND s.is_active = true
      AND (s.expires_at IS NULL OR s.expires_at > now())
    ORDER BY s.created_at ASC
  LOOP
    v_count := v_count + 1;
    v_max_items := v_max_items + COALESCE(r.max_items, 0);
    v_max_photos := GREATEST(v_max_photos, COALESCE(r.max_photos_per_listing, 0));
    v_storage_mb := v_storage_mb + COALESCE(r.storage_mb, 0);
    v_ai_credits := v_ai_credits + COALESCE(r.ai_credits_per_month, 0);
    v_visits := v_visits + COALESCE(r.monthly_visits_limit, 0);
    v_team := v_team + COALESCE(r.max_team_members, 0);

    IF public.tier_rank(r.tier) > v_effective_rank THEN
      v_effective_rank := public.tier_rank(r.tier);
      v_effective_tier := r.tier;
    END IF;

    v_subs := v_subs || jsonb_build_object(
      'id', r.id,
      'tier', r.tier,
      'name', r.name,
      'expires_at', r.expires_at,
      'started_at', r.started_at,
      'billing_period', r.billing_period,
      'max_items', COALESCE(r.max_items, 0),
      'max_photos_per_listing', COALESCE(r.max_photos_per_listing, 0),
      'storage_mb', COALESCE(r.storage_mb, 0),
      'ai_credits_per_month', COALESCE(r.ai_credits_per_month, 0),
      'monthly_visits_limit', COALESCE(r.monthly_visits_limit, 0),
      'max_team_members', COALESCE(r.max_team_members, 0)
    );
  END LOOP;

  -- Fallback to básico if no active subscription
  IF v_count = 0 THEN
    SELECT name, max_items, max_photos_per_listing, storage_mb, ai_credits_per_month, monthly_visits_limit, COALESCE(max_team_members, 0)
    INTO r
    FROM public.subscription_plans
    WHERE tier = 'basico' AND is_active = true LIMIT 1;
    v_max_items := COALESCE(r.max_items, 5);
    v_max_photos := COALESCE(r.max_photos_per_listing, 5);
    v_storage_mb := COALESCE(r.storage_mb, 15);
    v_ai_credits := COALESCE(r.ai_credits_per_month, 25);
    v_visits := COALESCE(r.monthly_visits_limit, 3000);
    v_team := COALESCE(r.max_team_members, 0);
    v_effective_tier := 'basico';
  END IF;

  RETURN jsonb_build_object(
    'count', v_count,
    'effective_tier', v_effective_tier,
    'subscriptions', v_subs,
    'aggregate', jsonb_build_object(
      'max_items', v_max_items,
      'max_photos_per_listing', v_max_photos,
      'storage_mb', v_storage_mb,
      'ai_credits_per_month', v_ai_credits,
      'monthly_visits_limit', v_visits,
      'max_team_members', v_team
    )
  );
END;
$$;

-- Update get_user_plan_usage to use aggregate
CREATE OR REPLACE FUNCTION public.get_user_plan_usage(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
  v_active_items integer := 0;
  v_total_photos integer := 0;
  v_storage_mb numeric := 0;
  v_balance integer := 0;
  v_monthly_visits integer := 0;
  v_eff jsonb;
  v_agg jsonb;
  v_tier text;
  v_plan_name text;
BEGIN
  SELECT id INTO v_seller_id FROM public.profiles WHERE user_id = p_user_id LIMIT 1;

  v_eff := public.get_effective_plan_limits(p_user_id);
  v_agg := v_eff->'aggregate';
  v_tier := v_eff->>'effective_tier';

  SELECT name INTO v_plan_name
  FROM public.subscription_plans
  WHERE tier = v_tier AND is_active = true LIMIT 1;

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
  WHERE user_id = p_user_id LIMIT 1;

  RETURN jsonb_build_object(
    'tier', v_tier,
    'plan_name', COALESCE(v_plan_name, 'Básico'),
    'subscriptions', v_eff->'subscriptions',
    'subscription_count', v_eff->'count',
    'usage', jsonb_build_object(
      'active_items', v_active_items,
      'total_photos', v_total_photos,
      'storage_mb', round(v_storage_mb, 2),
      'ai_credits_balance', COALESCE(v_balance, 0),
      'monthly_visits', COALESCE(v_monthly_visits, 0)
    ),
    'limits', jsonb_build_object(
      'max_items', COALESCE((v_agg->>'max_items')::int, 5),
      'max_photos_per_listing', COALESCE((v_agg->>'max_photos_per_listing')::int, 5),
      'storage_mb', COALESCE((v_agg->>'storage_mb')::int, 15),
      'ai_credits_per_month', COALESCE((v_agg->>'ai_credits_per_month')::int, 25),
      'monthly_visits_limit', COALESCE((v_agg->>'monthly_visits_limit')::int, 3000)
    )
  );
END;
$$;
