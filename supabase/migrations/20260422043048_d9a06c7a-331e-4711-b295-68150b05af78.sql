ALTER TABLE public.measured_properties
ADD COLUMN IF NOT EXISTS land_width numeric,
ADD COLUMN IF NOT EXISTS land_length numeric,
ADD COLUMN IF NOT EXISTS land_area_manual numeric,
ADD COLUMN IF NOT EXISTS measured_by text;

ALTER TABLE public.measured_rooms
ADD COLUMN IF NOT EXISTS area_type text NOT NULL DEFAULT 'Interna útil';

CREATE TABLE IF NOT EXISTS public.measured_property_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.measured_properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  category text NOT NULL DEFAULT 'Outros',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.measured_property_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own measured property photos"
ON public.measured_property_photos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own measured property photos"
ON public.measured_property_photos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own measured property photos"
ON public.measured_property_photos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own measured property photos"
ON public.measured_property_photos
FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_measured_property_photos_property_id
ON public.measured_property_photos(property_id);

CREATE TRIGGER update_measured_property_photos_updated_at
BEFORE UPDATE ON public.measured_property_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();