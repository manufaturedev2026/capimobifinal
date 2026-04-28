
-- 1. Trigger function for new profiles
CREATE OR REPLACE FUNCTION public.auto_create_ai_wallet_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_monthly integer;
  v_wallet_id uuid;
BEGIN
  v_monthly := public.get_ai_monthly_credits_for_tier('basico');
  
  INSERT INTO public.ai_credit_wallets (
    user_id, seller_id, balance, monthly_plan_credits, last_monthly_reset_at
  ) VALUES (
    NEW.user_id, NEW.id, v_monthly, v_monthly, now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET seller_id = COALESCE(public.ai_credit_wallets.seller_id, EXCLUDED.seller_id),
      updated_at = now()
  RETURNING id INTO v_wallet_id;

  IF v_wallet_id IS NOT NULL THEN
    INSERT INTO public.ai_credit_transactions (
      user_id, seller_id, wallet_id, tool_key, amount,
      transaction_type, status, notes, metadata
    ) VALUES (
      NEW.user_id, NEW.id, v_wallet_id, 'initial_signup', v_monthly,
      'monthly_credit', 'completed', 'Créditos iniciais do plano Básico', '{"tier":"basico"}'::jsonb
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_ai_wallet_on_profile ON public.profiles;
CREATE TRIGGER create_ai_wallet_on_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_ai_wallet_on_profile();

-- 2. Backfill existing users
INSERT INTO public.ai_credit_wallets (user_id, seller_id, balance, monthly_plan_credits, last_monthly_reset_at)
SELECT 
  p.user_id, 
  p.id,
  public.get_ai_monthly_credits_for_tier(COALESCE(s.tier::text, 'basico')),
  public.get_ai_monthly_credits_for_tier(COALESCE(s.tier::text, 'basico')),
  now()
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT tier FROM public.seller_subscriptions 
  WHERE user_id = p.user_id AND is_active = true 
  ORDER BY created_at DESC LIMIT 1
) s ON true
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_credit_wallets w WHERE w.user_id = p.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Admin variant of refresh
CREATE OR REPLACE FUNCTION public.refresh_ai_monthly_credits_admin(p_user_id uuid, p_seller_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id uuid;
  v_tier text := 'basico';
  v_seller_id uuid := p_seller_id;
  v_monthly integer;
  v_last_reset timestamp with time zone;
  v_balance integer;
  v_should_reset boolean := false;
BEGIN
  SELECT s.tier::text, COALESCE(v_seller_id, s.seller_id)
  INTO v_tier, v_seller_id
  FROM public.seller_subscriptions s
  WHERE s.user_id = p_user_id AND s.is_active = true
  ORDER BY s.created_at DESC LIMIT 1;

  v_tier := COALESCE(v_tier, 'basico');
  v_monthly := public.get_ai_monthly_credits_for_tier(v_tier);
  v_wallet_id := public.ensure_ai_credit_wallet(p_user_id, v_seller_id);

  SELECT balance, last_monthly_reset_at INTO v_balance, v_last_reset
  FROM public.ai_credit_wallets WHERE id = v_wallet_id FOR UPDATE;

  v_should_reset := v_last_reset IS NULL OR date_trunc('month', v_last_reset) < date_trunc('month', now());

  IF v_should_reset THEN
    UPDATE public.ai_credit_wallets
    SET balance = balance + v_monthly,
        monthly_plan_credits = v_monthly,
        last_monthly_reset_at = now(),
        updated_at = now()
    WHERE id = v_wallet_id RETURNING balance INTO v_balance;

    INSERT INTO public.ai_credit_transactions (
      user_id, seller_id, wallet_id, tool_key, amount,
      transaction_type, status, notes, metadata
    ) VALUES (
      p_user_id, v_seller_id, v_wallet_id, 'monthly_plan_reset', v_monthly,
      'monthly_credit', 'completed', 'Recarga mensal automática', jsonb_build_object('tier', v_tier, 'source', 'cron')
    );
  END IF;

  RETURN jsonb_build_object('balance', v_balance, 'tier', v_tier, 'reset_applied', v_should_reset);
END;
$$;

-- 4. Cron orchestrator
CREATE OR REPLACE FUNCTION public.cron_reset_all_monthly_credits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
  v_user record;
BEGIN
  FOR v_user IN 
    SELECT DISTINCT w.user_id, w.seller_id
    FROM public.ai_credit_wallets w
    WHERE w.last_monthly_reset_at IS NULL 
       OR date_trunc('month', w.last_monthly_reset_at) < date_trunc('month', now())
  LOOP
    BEGIN
      PERFORM public.refresh_ai_monthly_credits_admin(v_user.user_id, v_user.seller_id);
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;
  END LOOP;

  RETURN jsonb_build_object('reset_count', v_count, 'ran_at', now());
END;
$$;

-- 5. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
