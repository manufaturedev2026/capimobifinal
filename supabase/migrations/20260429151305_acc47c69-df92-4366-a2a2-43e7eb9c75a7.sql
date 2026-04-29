
-- 1. Adiciona colunas de limites na tabela de planos
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_photos_per_listing integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS storage_mb integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS ai_credits_per_month integer NOT NULL DEFAULT 25;

-- 2. Atualiza preços, limites e créditos para todos os planos ativos
-- CORRETOR
UPDATE public.subscription_plans SET price = 0,      max_items = 3,      max_photos_per_listing = 5,  storage_mb = 15,    ai_credits_per_month = 25    WHERE tier = 'basico';
UPDATE public.subscription_plans SET price = 29.90,  max_items = 15,     max_photos_per_listing = 10, storage_mb = 75,    ai_credits_per_month = 250   WHERE tier = 'start';
UPDATE public.subscription_plans SET price = 59.90,  max_items = 50,     max_photos_per_listing = 15, storage_mb = 380,   ai_credits_per_month = 600   WHERE tier = 'premium';
UPDATE public.subscription_plans SET price = 119.90, max_items = 150,    max_photos_per_listing = 20, storage_mb = 1500,  ai_credits_per_month = 1500  WHERE tier = 'prime';

-- IMOBILIÁRIA
UPDATE public.subscription_plans SET price = 0,      max_items = 3,      max_photos_per_listing = 5,  storage_mb = 15,    ai_credits_per_month = 25    WHERE tier = 'imob_basico';
UPDATE public.subscription_plans SET price = 119.90, max_items = 100,    max_photos_per_listing = 15, storage_mb = 750,   ai_credits_per_month = 1500  WHERE tier = 'imob_start';
UPDATE public.subscription_plans SET price = 239.90, max_items = 300,    max_photos_per_listing = 20, storage_mb = 3000,  ai_credits_per_month = 3000  WHERE tier = 'imob_pro';
UPDATE public.subscription_plans SET price = 479.90, max_items = 5000,   max_photos_per_listing = 25, storage_mb = 12000, ai_credits_per_month = 6000  WHERE tier = 'imob_elite';

-- CONSTRUTORA
UPDATE public.subscription_plans SET price = 0,      max_items = 3,      max_photos_per_listing = 5,  storage_mb = 15,    ai_credits_per_month = 25    WHERE tier = 'const_basico';
UPDATE public.subscription_plans SET price = 179.90, max_items = 150,    max_photos_per_listing = 20, storage_mb = 1500,  ai_credits_per_month = 2000  WHERE tier = 'const_start';
UPDATE public.subscription_plans SET price = 359.90, max_items = 500,    max_photos_per_listing = 25, storage_mb = 6000,  ai_credits_per_month = 4500  WHERE tier = 'const_pro';
UPDATE public.subscription_plans SET price = 779.90, max_items = 10000,  max_photos_per_listing = 30, storage_mb = 25000, ai_credits_per_month = 10000 WHERE tier = 'const_master';

-- 3. Recalibra custos de IA para garantir margem
UPDATE public.ai_tool_costs SET cost = 1 WHERE tool_key = 'platform_help_chat';
UPDATE public.ai_tool_costs SET cost = 1 WHERE tool_key = 'gallery_ai_headline';
UPDATE public.ai_tool_costs SET cost = 3 WHERE tool_key = 'capture_bot_chat';
UPDATE public.ai_tool_costs SET cost = 3 WHERE tool_key = 'agenda_bot_chat';
UPDATE public.ai_tool_costs SET cost = 2 WHERE tool_key = 'invite_chat';
UPDATE public.ai_tool_costs SET cost = 2 WHERE tool_key = 'capture_ad_copy';
UPDATE public.ai_tool_costs SET cost = 3 WHERE tool_key = 'valuation_ad';
UPDATE public.ai_tool_costs SET cost = 4 WHERE tool_key = 'contract_generation';
UPDATE public.ai_tool_costs SET cost = 5 WHERE tool_key = 'photo_analysis';
UPDATE public.ai_tool_costs SET cost = 6 WHERE tool_key = 'property_valuation';

-- 4. Atualiza função get_ai_monthly_credits_for_tier para refletir novos valores e incluir tiers de imob/const
CREATE OR REPLACE FUNCTION public.get_ai_monthly_credits_for_tier(p_tier text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE COALESCE(p_tier, 'basico')
    -- corretor
    WHEN 'basico' THEN 25
    WHEN 'start' THEN 250
    WHEN 'premium' THEN 600
    WHEN 'prime' THEN 1500
    WHEN 'vip' THEN 1000
    -- imobiliária
    WHEN 'imob_basico' THEN 25
    WHEN 'imob_start' THEN 1500
    WHEN 'imob_pro' THEN 3000
    WHEN 'imob_elite' THEN 6000
    -- construtora
    WHEN 'const_basico' THEN 25
    WHEN 'const_start' THEN 2000
    WHEN 'const_pro' THEN 4500
    WHEN 'const_master' THEN 10000
    -- empresa legado
    WHEN 'essencial_empresa' THEN 2000
    WHEN 'premium_empresa' THEN 2000
    WHEN 'prime_empresa' THEN 3500
    -- fundador
    WHEN 'fundador_corretor' THEN 500
    WHEN 'fundador_empresa' THEN 1750
    ELSE 25
  END
$function$;

-- 5. Função para retornar uso vs limites do usuário (storage, fotos, anúncios, créditos)
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
BEGIN
  SELECT id INTO v_seller_id FROM public.profiles WHERE user_id = p_user_id LIMIT 1;

  SELECT tier::text INTO v_tier
  FROM public.seller_subscriptions
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  v_tier := COALESCE(v_tier, 'basico');

  SELECT max_items, max_photos_per_listing, storage_mb, ai_credits_per_month, name
  INTO v_plan
  FROM public.subscription_plans
  WHERE tier = v_tier AND is_active = true
  LIMIT 1;

  IF v_seller_id IS NOT NULL THEN
    SELECT count(*), COALESCE(SUM(coalesce(array_length(photos,1),0)), 0)
    INTO v_active_items, v_total_photos
    FROM public.seller_items
    WHERE seller_id = v_seller_id AND status = 'ativo';

    -- Estimativa: 300KB por foto comprimida
    v_storage_mb := (v_total_photos * 0.3);
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
      'ai_credits_balance', COALESCE(v_balance, 0)
    ),
    'limits', jsonb_build_object(
      'max_items', COALESCE(v_plan.max_items, 3),
      'max_photos_per_listing', COALESCE(v_plan.max_photos_per_listing, 5),
      'storage_mb', COALESCE(v_plan.storage_mb, 15),
      'ai_credits_per_month', COALESCE(v_plan.ai_credits_per_month, 25)
    )
  );
END;
$function$;
