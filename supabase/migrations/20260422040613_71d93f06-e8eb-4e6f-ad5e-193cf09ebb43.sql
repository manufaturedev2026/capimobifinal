CREATE TABLE public.measured_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'Casa',
  address TEXT,
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  notes TEXT,
  total_area NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.measured_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.measured_properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL,
  shape TEXT NOT NULL DEFAULT 'Retângulo',
  width NUMERIC,
  length NUMERIC,
  height NUMERIC,
  base NUMERIC,
  side_a NUMERIC,
  side_b NUMERIC,
  area NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.measured_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measured_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own measured properties"
ON public.measured_properties
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own measured properties"
ON public.measured_properties
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measured properties"
ON public.measured_properties
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own measured properties"
ON public.measured_properties
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own measured rooms"
ON public.measured_rooms
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own measured rooms"
ON public.measured_rooms
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.measured_properties p
    WHERE p.id = property_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own measured rooms"
ON public.measured_rooms
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.measured_properties p
    WHERE p.id = property_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own measured rooms"
ON public.measured_rooms
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.refresh_measured_property_total()
RETURNS TRIGGER AS $$
DECLARE
  v_property_id UUID;
BEGIN
  v_property_id := COALESCE(NEW.property_id, OLD.property_id);

  UPDATE public.measured_properties
  SET total_area = COALESCE((
    SELECT SUM(area)
    FROM public.measured_rooms
    WHERE property_id = v_property_id
  ), 0),
  updated_at = now()
  WHERE id = v_property_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_measured_properties_updated_at
BEFORE UPDATE ON public.measured_properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_measured_rooms_updated_at
BEFORE UPDATE ON public.measured_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER refresh_property_total_after_room_insert
AFTER INSERT ON public.measured_rooms
FOR EACH ROW
EXECUTE FUNCTION public.refresh_measured_property_total();

CREATE TRIGGER refresh_property_total_after_room_update
AFTER UPDATE OF area, property_id ON public.measured_rooms
FOR EACH ROW
EXECUTE FUNCTION public.refresh_measured_property_total();

CREATE TRIGGER refresh_property_total_after_room_delete
AFTER DELETE ON public.measured_rooms
FOR EACH ROW
EXECUTE FUNCTION public.refresh_measured_property_total();

CREATE INDEX idx_measured_properties_user_id ON public.measured_properties(user_id);
CREATE INDEX idx_measured_rooms_property_id ON public.measured_rooms(property_id);
CREATE INDEX idx_measured_rooms_user_id ON public.measured_rooms(user_id);