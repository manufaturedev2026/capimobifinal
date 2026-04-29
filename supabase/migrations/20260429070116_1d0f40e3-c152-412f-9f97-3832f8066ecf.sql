-- 1. Adiciona colunas
ALTER TABLE public.founder_lots
  ADD COLUMN IF NOT EXISTS inherited_tier text,
  ADD COLUMN IF NOT EXISTS ia_credits integer;

-- 2. Backfill com defaults sensatos baseados na categoria
UPDATE public.founder_lots
SET inherited_tier = CASE
      WHEN category = 'individual' THEN 'vip'
      WHEN category = 'enterprise' THEN 'prime_empresa'
      ELSE 'vip'
    END
WHERE inherited_tier IS NULL;

UPDATE public.founder_lots
SET ia_credits = CASE
      WHEN category = 'individual' THEN 1000
      WHEN category = 'enterprise' THEN 3500
      ELSE 1000
    END
WHERE ia_credits IS NULL;

-- 3. Constraint de tier válido
ALTER TABLE public.founder_lots
  DROP CONSTRAINT IF EXISTS founder_lots_inherited_tier_check;
ALTER TABLE public.founder_lots
  ADD CONSTRAINT founder_lots_inherited_tier_check
  CHECK (inherited_tier IN (
    'start','premium','vip',
    'essencial_empresa','premium_empresa','prime_empresa'
  ));

-- 4. Defaults para novos lotes
ALTER TABLE public.founder_lots
  ALTER COLUMN inherited_tier SET DEFAULT 'vip',
  ALTER COLUMN ia_credits SET DEFAULT 1000,
  ALTER COLUMN inherited_tier SET NOT NULL,
  ALTER COLUMN ia_credits SET NOT NULL;

-- 5. Atualiza consume_founder_slot para herdar configs
CREATE OR REPLACE FUNCTION public.consume_founder_slot(p_lot_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_updated INTEGER;
  v_lot RECORD;
  v_settings RECORD;
  v_new_price NUMERIC;
  v_new_lot_number INTEGER;
BEGIN
  SELECT * INTO v_settings FROM public.founder_settings WHERE id = 1;
  IF v_settings.is_enabled = false THEN
    RETURN false;
  END IF;

  UPDATE public.founder_lots
  SET used_slots = used_slots + 1,
      updated_at = now()
  WHERE id = p_lot_id
    AND is_active = true
    AND used_slots < total_slots
  RETURNING * INTO v_lot;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN false;
  END IF;

  IF v_lot.used_slots >= v_lot.total_slots AND v_settings.loop_enabled = true THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.founder_lots
      WHERE category = v_lot.category
        AND is_active = true
        AND used_slots < total_slots
    ) THEN
      SELECT COALESCE(MAX(lot_number), 0) + 1 INTO v_new_lot_number
      FROM public.founder_lots WHERE category = v_lot.category;

      v_new_price := v_lot.price + COALESCE(v_settings.price_increment, 30);

      INSERT INTO public.founder_lots (
        category, lot_number, price, total_slots, used_slots, is_active,
        inherited_tier, ia_credits
      ) VALUES (
        v_lot.category, v_new_lot_number, v_new_price,
        COALESCE(v_settings.default_slots, 500), 0, true,
        v_lot.inherited_tier, v_lot.ia_credits
      );
    END IF;
  END IF;

  RETURN true;
END;
$function$;