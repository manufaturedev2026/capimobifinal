CREATE TABLE IF NOT EXISTS public.founder_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('individual','enterprise')),
  lot_number INTEGER NOT NULL CHECK (lot_number > 0),
  price NUMERIC NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 500,
  used_slots INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category, lot_number)
);

ALTER TABLE public.founder_lots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read founder lots" ON public.founder_lots;
CREATE POLICY "Anyone can read founder lots"
ON public.founder_lots FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage founder lots" ON public.founder_lots;
CREATE POLICY "Admins manage founder lots"
ON public.founder_lots FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_founder_lots_updated_at ON public.founder_lots;
CREATE TRIGGER update_founder_lots_updated_at
BEFORE UPDATE ON public.founder_lots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.founder_lots (category, lot_number, price, total_slots) VALUES
  ('individual', 1, 97,  500),
  ('individual', 2, 120, 500),
  ('individual', 3, 150, 500),
  ('enterprise', 1, 97,  500),
  ('enterprise', 2, 120, 500),
  ('enterprise', 3, 150, 500)
ON CONFLICT (category, lot_number) DO NOTHING;

CREATE OR REPLACE FUNCTION public.consume_founder_slot(p_lot_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.founder_lots
  SET used_slots = used_slots + 1,
      updated_at = now()
  WHERE id = p_lot_id
    AND is_active = true
    AND used_slots < total_slots;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;