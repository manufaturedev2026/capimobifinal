CREATE TABLE IF NOT EXISTS public.ai_credit_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  seller_id uuid,
  balance integer NOT NULL DEFAULT 0,
  monthly_plan_credits integer NOT NULL DEFAULT 0,
  last_monthly_reset_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  seller_id uuid,
  wallet_id uuid NOT NULL REFERENCES public.ai_credit_wallets(id) ON DELETE CASCADE,
  tool_key text NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  external_reference text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_user_created ON public.ai_credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_wallet_created ON public.ai_credit_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_external_reference ON public.ai_credit_transactions(external_reference) WHERE external_reference IS NOT NULL;

CREATE POLICY "Users can view own ai credit wallet"
ON public.ai_credit_wallets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage ai credit wallets"
ON public.ai_credit_wallets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own ai credit transactions"
ON public.ai_credit_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage ai credit transactions"
ON public.ai_credit_transactions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.ensure_ai_credit_wallet(
  p_user_id uuid,
  p_seller_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
BEGIN
  INSERT INTO public.ai_credit_wallets (user_id, seller_id)
  VALUES (p_user_id, p_seller_id)
  ON CONFLICT (user_id) DO UPDATE
  SET seller_id = COALESCE(public.ai_credit_wallets.seller_id, EXCLUDED.seller_id),
      updated_at = now()
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_ai_credits(
  p_user_id uuid,
  p_amount integer,
  p_transaction_type text,
  p_tool_key text DEFAULT 'credit_purchase',
  p_seller_id uuid DEFAULT NULL,
  p_external_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_new_balance integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  v_wallet_id := public.ensure_ai_credit_wallet(p_user_id, p_seller_id);

  UPDATE public.ai_credit_wallets
  SET balance = balance + p_amount,
      seller_id = COALESCE(seller_id, p_seller_id),
      updated_at = now()
  WHERE id = v_wallet_id
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.ai_credit_transactions (
    user_id, seller_id, wallet_id, tool_key, amount,
    transaction_type, status, external_reference, notes, metadata
  ) VALUES (
    p_user_id, p_seller_id, v_wallet_id, p_tool_key, p_amount,
    p_transaction_type, 'completed', p_external_reference, p_notes, COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_ai_credits(
  p_user_id uuid,
  p_amount integer,
  p_tool_key text,
  p_seller_id uuid DEFAULT NULL,
  p_external_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  IF p_tool_key IS NULL OR btrim(p_tool_key) = '' THEN
    RAISE EXCEPTION 'tool_key is required';
  END IF;

  v_wallet_id := public.ensure_ai_credit_wallet(p_user_id, p_seller_id);

  SELECT balance INTO v_current_balance
  FROM public.ai_credit_wallets
  WHERE id = v_wallet_id
  FOR UPDATE;

  IF v_current_balance < p_amount THEN
    INSERT INTO public.ai_credit_transactions (
      user_id, seller_id, wallet_id, tool_key, amount,
      transaction_type, status, external_reference, notes, metadata
    ) VALUES (
      p_user_id, p_seller_id, v_wallet_id, p_tool_key, -p_amount,
      'debit', 'insufficient_funds', p_external_reference, p_notes, COALESCE(p_metadata, '{}'::jsonb)
    );

    RETURN jsonb_build_object(
      'success', false,
      'balance', v_current_balance,
      'required', p_amount,
      'reason', 'insufficient_funds'
    );
  END IF;

  UPDATE public.ai_credit_wallets
  SET balance = balance - p_amount,
      seller_id = COALESCE(seller_id, p_seller_id),
      updated_at = now()
  WHERE id = v_wallet_id
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.ai_credit_transactions (
    user_id, seller_id, wallet_id, tool_key, amount,
    transaction_type, status, external_reference, notes, metadata
  ) VALUES (
    p_user_id, p_seller_id, v_wallet_id, p_tool_key, -p_amount,
    'debit', 'completed', p_external_reference, p_notes, COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'charged', p_amount
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_ai_credits(
  p_user_id uuid,
  p_amount integer,
  p_tool_key text,
  p_seller_id uuid DEFAULT NULL,
  p_external_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.add_ai_credits(
    p_user_id,
    p_amount,
    'refund',
    p_tool_key,
    p_seller_id,
    p_external_reference,
    p_notes,
    p_metadata
  );
END;
$$;

CREATE TRIGGER update_ai_credit_wallets_updated_at
BEFORE UPDATE ON public.ai_credit_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();