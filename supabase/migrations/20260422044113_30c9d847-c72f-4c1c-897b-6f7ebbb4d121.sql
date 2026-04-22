ALTER TABLE public.measured_properties
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS number text,
ADD COLUMN IF NOT EXISTS complement text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS reference_point text,
ADD COLUMN IF NOT EXISTS asking_price numeric,
ADD COLUMN IF NOT EXISTS bedrooms integer,
ADD COLUMN IF NOT EXISTS bathrooms integer,
ADD COLUMN IF NOT EXISTS parking_spaces integer,
ADD COLUMN IF NOT EXISTS iptu numeric,
ADD COLUMN IF NOT EXISTS condominium_fee numeric;

ALTER TABLE public.measured_property_photos
ADD COLUMN IF NOT EXISTS room_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'measured_property_photos_room_id_fkey'
  ) THEN
    ALTER TABLE public.measured_property_photos
    ADD CONSTRAINT measured_property_photos_room_id_fkey
    FOREIGN KEY (room_id) REFERENCES public.measured_rooms(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.property_valuations
ADD COLUMN IF NOT EXISTS measured_property_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'property_valuations_measured_property_id_fkey'
  ) THEN
    ALTER TABLE public.property_valuations
    ADD CONSTRAINT property_valuations_measured_property_id_fkey
    FOREIGN KEY (measured_property_id) REFERENCES public.measured_properties(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_measured_property_photos_room_id ON public.measured_property_photos(room_id);
CREATE INDEX IF NOT EXISTS idx_property_valuations_measured_property_id ON public.property_valuations(measured_property_id);