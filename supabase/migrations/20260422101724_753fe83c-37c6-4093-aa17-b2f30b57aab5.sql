CREATE OR REPLACE FUNCTION public.get_ai_monthly_credits_for_tier(p_tier text)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE COALESCE(p_tier, 'basico')
    WHEN 'basico' THEN 10
    WHEN 'start' THEN 25
    WHEN 'premium' THEN 60
    WHEN 'vip' THEN 150
    WHEN 'essencial_empresa' THEN 250
    WHEN 'premium_empresa' THEN 500
    WHEN 'prime_empresa' THEN 1000
    WHEN 'black' THEN 1000
    ELSE 10
  END
$$;

CREATE OR REPLACE FUNCTION public.refresh_ai_monthly_credits(
  p_user_id uuid,
  p_seller_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT tier, COALESCE(v_seller_id, seller_id)
  INTO v_tier, v_seller_id
  FROM public.seller_subscriptions
  WHERE user_id = p_user_id
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  v_tier := COALESCE(v_tier, 'basico');
  v_monthly := public.get_ai_monthly_credits_for_tier(v_tier);
  v_wallet_id := public.ensure_ai_credit_wallet(p_user_id, v_seller_id);

  SELECT balance, last_monthly_reset_at
  INTO v_balance, v_last_reset
  FROM public.ai_credit_wallets
  WHERE id = v_wallet_id
  FOR UPDATE;

  v_should_reset := v_last_reset IS NULL OR date_trunc('month', v_last_reset) < date_trunc('month', now());

  IF v_should_reset THEN
    UPDATE public.ai_credit_wallets
    SET balance = balance + v_monthly,
        monthly_plan_credits = v_monthly,
        last_monthly_reset_at = now(),
        seller_id = COALESCE(seller_id, v_seller_id),
        updated_at = now()
    WHERE id = v_wallet_id
    RETURNING balance INTO v_balance;

    INSERT INTO public.ai_credit_transactions (
      user_id, seller_id, wallet_id, tool_key, amount,
      transaction_type, status, notes, metadata
    ) VALUES (
      p_user_id, v_seller_id, v_wallet_id, 'monthly_plan_reset', v_monthly,
      'monthly_credit', 'completed', 'Créditos mensais do plano', jsonb_build_object('tier', v_tier)
    );
  ELSE
    UPDATE public.ai_credit_wallets
    SET monthly_plan_credits = v_monthly,
        seller_id = COALESCE(seller_id, v_seller_id),
        updated_at = now()
    WHERE id = v_wallet_id
    RETURNING balance INTO v_balance;
  END IF;

  RETURN jsonb_build_object(
    'wallet_id', v_wallet_id,
    'balance', v_balance,
    'monthly_plan_credits', v_monthly,
    'tier', v_tier,
    'reset_applied', v_should_reset,
    'credit_price_cents', 25
  );
END;
$$;