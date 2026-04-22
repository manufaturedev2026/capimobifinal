ALTER TABLE public.measured_properties
ADD COLUMN IF NOT EXISTS measurement_mode text NOT NULL DEFAULT 'ambientes',
ADD COLUMN IF NOT EXISTS external_shape text,
ADD COLUMN IF NOT EXISTS external_width numeric,
ADD COLUMN IF NOT EXISTS external_length numeric,
ADD COLUMN IF NOT EXISTS external_base numeric,
ADD COLUMN IF NOT EXISTS external_height numeric,
ADD COLUMN IF NOT EXISTS external_side_a numeric,
ADD COLUMN IF NOT EXISTS external_side_b numeric,
ADD COLUMN IF NOT EXISTS external_area_manual numeric;