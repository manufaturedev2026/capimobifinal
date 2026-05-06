-- grant_plan_credits: Founder no longer gets 12x upfront. It receives only the monthly value
-- on purchase, and refresh_ai_monthly_credits will top it up every new month.
CREATE OR REPLACE FUNCTION public.grant_plan_credits(
  p_user_id uuid,
  p_seller_id uuid DEFAULT NULL,
  p_tier text DEFAULT 'basico',
  p_billing_period text DEFAULT 'monthly'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id uuid;
  v_monthly integer;
  v_total integer;
  v_balance integer;
  v_is_annual boolean := (p_billing_period = 'annual');
  v_is_founder boolean := (p_billing_period = 'founder' OR p_tier IN ('fundador_corretor', 'fundador_empresa', 'fundador_construtora'));
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  v_monthly := public.get_ai_monthly_credits_for_tier(COALESCE(p_tier, 'basico'));

  -- Annual: 12 months upfront. Founder & Monthly: monthly value only (top-ups happen each month).
  IF v_is_annual THEN
    v_total := v_monthly * 12;
  ELSE
    v_total := v_monthly;
  END IF;

  v_wallet_id := public.ensure_ai_credit_wallet(p_user_id, p_seller_id);

  UPDATE public.ai_credit_wallets
  SET balance = balance + v_total,
      monthly_plan_credits = CASE WHEN v_is_annual THEN 0 ELSE v_monthly END,
      last_monthly_reset_at = now(),
      seller_id = COALESCE(seller_id, p_seller_id),
      updated_at = now()
  WHERE id = v_wallet_id
  RETURNING balance INTO v_balance;

  INSERT INTO public.ai_credit_transactions (
    user_id, seller_id, wallet_id, tool_key, amount,
    transaction_type, status, notes, metadata
  ) VALUES (
    p_user_id, p_seller_id, v_wallet_id, 'plan_purchase_grant', v_total,
    'monthly_credit', 'completed',
    CASE
      WHEN v_is_annual THEN 'Créditos anuais entregues integralmente na compra'
      WHEN v_is_founder THEN 'Créditos Fundador (1º mês) entregues na compra'
      ELSE 'Créditos mensais concedidos pela compra/troca de plano'
    END,
    jsonb_build_object('tier', p_tier, 'billing_period', p_billing_period, 'monthly_value', v_monthly, 'total_granted', v_total)
  );

  RETURN jsonb_build_object(
    'wallet_id', v_wallet_id,
    'balance', v_balance,
    'granted', v_total,
    'tier', p_tier,
    'billing_period', p_billing_period
  );
END;
$$;

-- refresh_ai_monthly_credits: Founder DOES recharge monthly (only Annual is excluded).
CREATE OR REPLACE FUNCTION public.refresh_ai_monthly_credits(p_user_id uuid, p_seller_id uuid DEFAULT NULL::uuid)
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
  v_expires_at timestamp with time zone;
  v_is_active boolean := false;
  v_is_founder boolean := false;
  v_is_annual boolean := false;
  v_billing_period text := 'monthly';
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT tier::text, COALESCE(v_seller_id, seller_id), expires_at, is_active, COALESCE(billing_period, 'monthly')
  INTO v_tier, v_seller_id, v_expires_at, v_is_active, v_billing_period
  FROM public.seller_subscriptions
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  v_tier := COALESCE(v_tier, 'basico');
  v_is_founder := v_tier IN ('fundador_corretor', 'fundador_empresa', 'fundador_construtora') OR v_billing_period = 'founder';
  v_is_annual := v_billing_period = 'annual';
  v_monthly := public.get_ai_monthly_credits_for_tier(v_tier);
  v_wallet_id := public.ensure_ai_credit_wallet(p_user_id, v_seller_id);

  SELECT balance, last_monthly_reset_at
  INTO v_balance, v_last_reset
  FROM public.ai_credit_wallets
  WHERE id = v_wallet_id
  FOR UPDATE;

  -- Monthly AND Founder both recharge monthly. Only Annual is excluded (got 12x upfront).
  v_should_reset := NOT v_is_annual
    AND v_is_active = true
    AND (v_expires_at IS NULL OR v_expires_at > now())
    AND (v_last_reset IS NULL OR date_trunc('month', v_last_reset) < date_trunc('month', now()));

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
      'monthly_credit', 'completed',
      CASE WHEN v_is_founder THEN 'Recarga mensal Fundador' ELSE 'Créditos mensais do plano' END,
      jsonb_build_object('tier', v_tier, 'expires_at', v_expires_at, 'billing_period', v_billing_period)
    );
  ELSE
    UPDATE public.ai_credit_wallets
    SET monthly_plan_credits = CASE WHEN v_is_annual THEN 0 ELSE v_monthly END,
        seller_id = COALESCE(seller_id, v_seller_id),
        updated_at = now()
    WHERE id = v_wallet_id
    RETURNING balance INTO v_balance;
  END IF;

  RETURN jsonb_build_object(
    'wallet_id', v_wallet_id,
    'balance', v_balance,
    'monthly_plan_credits', CASE WHEN v_is_annual THEN 0 ELSE v_monthly END,
    'tier', v_tier,
    'billing_period', v_billing_period,
    'reset_applied', v_should_reset,
    'is_founder', v_is_founder,
    'is_annual', v_is_annual,
    'expires_at', v_expires_at,
    'credit_price_cents', 25
  );
END;
$$;

-- Backfill the test user's wallet so the dashboard immediately reflects the monthly recharge value.
UPDATE public.ai_credit_wallets w
SET monthly_plan_credits = public.get_ai_monthly_credits_for_tier(s.tier::text),
    updated_at = now()
FROM public.seller_subscriptions s
WHERE w.user_id = s.user_id
  AND s.is_active = true
  AND (s.billing_period = 'founder' OR s.tier::text IN ('fundador_corretor', 'fundador_empresa', 'fundador_construtora'));