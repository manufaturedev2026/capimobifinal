
CREATE TABLE public.rental_properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  title text NOT NULL,
  address text,
  city text,
  photo_url text,
  owner_name text,
  owner_phone text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.rental_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rental properties"
  ON public.rental_properties FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rental properties"
  ON public.rental_properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rental properties"
  ON public.rental_properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rental properties"
  ON public.rental_properties FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_rental_properties_updated_at
  BEFORE UPDATE ON public.rental_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
