
-- Tabela de configurações globais do sistema Fundador
CREATE TABLE IF NOT EXISTS public.founder_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  loop_enabled BOOLEAN NOT NULL DEFAULT true,
  price_increment NUMERIC NOT NULL DEFAULT 30,
  default_slots INTEGER NOT NULL DEFAULT 500,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT founder_settings_singleton CHECK (id = 1)
);

INSERT INTO public.founder_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.founder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read founder settings"
  ON public.founder_settings FOR SELECT
  TO public USING (true);

CREATE POLICY "Admins manage founder settings"
  ON public.founder_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Substitui consume_founder_slot para suportar loop automático
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
  -- Verifica se sistema está habilitado
  SELECT * INTO v_settings FROM public.founder_settings WHERE id = 1;
  IF v_settings.is_enabled = false THEN
    RETURN false;
  END IF;

  -- Tenta consumir o slot
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

  -- Se esgotou e loop está habilitado, cria próximo lote automaticamente
  IF v_lot.used_slots >= v_lot.total_slots AND v_settings.loop_enabled = true THEN
    -- Verifica se já existe um lote ativo com vagas para essa categoria
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
        category, lot_number, price, total_slots, used_slots, is_active
      ) VALUES (
        v_lot.category, v_new_lot_number, v_new_price,
        COALESCE(v_settings.default_slots, 500), 0, true
      );
    END IF;
  END IF;

  RETURN true;
END;
$function$;
