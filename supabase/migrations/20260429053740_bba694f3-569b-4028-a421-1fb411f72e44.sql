
CREATE OR REPLACE FUNCTION public.grant_plan_credits(
  p_user_id uuid,
  p_seller_id uuid DEFAULT NULL,
  p_tier text DEFAULT 'basico'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id uuid;
  v_monthly integer;
  v_balance integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  v_monthly := public.get_ai_monthly_credits_for_tier(COALESCE(p_tier, 'basico'));
  v_wallet_id := public.ensure_ai_credit_wallet(p_user_id, p_seller_id);

  UPDATE public.ai_credit_wallets
  SET balance = balance + v_monthly,
      monthly_plan_credits = v_monthly,
      last_monthly_reset_at = now(),
      seller_id = COALESCE(seller_id, p_seller_id),
      updated_at = now()
  WHERE id = v_wallet_id
  RETURNING balance INTO v_balance;

  INSERT INTO public.ai_credit_transactions (
    user_id, seller_id, wallet_id, tool_key, amount,
    transaction_type, status, notes, metadata
  ) VALUES (
    p_user_id, p_seller_id, v_wallet_id, 'plan_purchase_grant', v_monthly,
    'monthly_credit', 'completed',
    'Créditos concedidos pela compra/troca de plano',
    jsonb_build_object('tier', p_tier, 'source', 'plan_purchase')
  );

  RETURN jsonb_build_object(
    'wallet_id', v_wallet_id,
    'balance', v_balance,
    'granted', v_monthly,
    'tier', p_tier
  );
END;
$$;
