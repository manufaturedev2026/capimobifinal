
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
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  -- Pega assinatura ativa mais recente, junto com expires_at
  SELECT tier, COALESCE(v_seller_id, seller_id), expires_at, is_active
  INTO v_tier, v_seller_id, v_expires_at, v_is_active
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

  -- 🔑 Só recarrega se a assinatura está ativa E não expirou
  -- Isso garante que o anual libera créditos mês a mês (até 12 vezes durante o ano)
  -- e o mensal só recebe a recarga inicial (expira em 30 dias)
  v_should_reset := v_is_active = true
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
    'expires_at', v_expires_at,
    'credit_price_cents', 25
  );
END;
$function$;
