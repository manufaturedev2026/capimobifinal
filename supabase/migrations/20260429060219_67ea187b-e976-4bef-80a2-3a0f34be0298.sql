-- Atualiza função de créditos por tier para incluir tiers Fundador
CREATE OR REPLACE FUNCTION public.get_ai_monthly_credits_for_tier(p_tier text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE COALESCE(p_tier, 'basico')
    WHEN 'basico' THEN 25
    WHEN 'start' THEN 250
    WHEN 'premium' THEN 600
    WHEN 'vip' THEN 1000
    WHEN 'essencial_empresa' THEN 2000
    WHEN 'premium_empresa' THEN 2000
    WHEN 'prime_empresa' THEN 3500
    WHEN 'fundador_corretor' THEN 500
    WHEN 'fundador_empresa' THEN 1750
    ELSE 25
  END
$$;

-- Garante que tiers Fundador não recebam recarga mensal (créditos vitalícios da compra)
CREATE OR REPLACE FUNCTION public.refresh_ai_monthly_credits(p_user_id uuid, p_seller_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT tier, COALESCE(v_seller_id, seller_id), expires_at, is_active
  INTO v_tier, v_seller_id, v_expires_at, v_is_active
  FROM public.seller_subscriptions
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  v_tier := COALESCE(v_tier, 'basico');
  v_is_founder := v_tier IN ('fundador_corretor', 'fundador_empresa');
  v_monthly := public.get_ai_monthly_credits_for_tier(v_tier);
  v_wallet_id := public.ensure_ai_credit_wallet(p_user_id, v_seller_id);

  SELECT balance, last_monthly_reset_at
  INTO v_balance, v_last_reset
  FROM public.ai_credit_wallets
  WHERE id = v_wallet_id
  FOR UPDATE;

  -- Fundador NUNCA recarrega: créditos vêm uma única vez na compra
  v_should_reset := NOT v_is_founder
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
      'monthly_credit', 'completed', 'Créditos mensais do plano',
      jsonb_build_object('tier', v_tier, 'expires_at', v_expires_at)
    );
  ELSE
    UPDATE public.ai_credit_wallets
    SET monthly_plan_credits = CASE WHEN v_is_founder THEN 0 ELSE v_monthly END,
        seller_id = COALESCE(seller_id, v_seller_id),
        updated_at = now()
    WHERE id = v_wallet_id
    RETURNING balance INTO v_balance;
  END IF;

  RETURN jsonb_build_object(
    'wallet_id', v_wallet_id,
    'balance', v_balance,
    'monthly_plan_credits', CASE WHEN v_is_founder THEN 0 ELSE v_monthly END,
    'tier', v_tier,
    'reset_applied', v_should_reset,
    'is_founder', v_is_founder,
    'expires_at', v_expires_at,
    'credit_price_cents', 25
  );
END;
$function$;