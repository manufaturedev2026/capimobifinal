
CREATE TABLE public.property_capture_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL,
  seller_user_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  property_type text NOT NULL DEFAULT 'casa',
  address text,
  desired_price numeric,
  photos text[] DEFAULT '{}'::text[],
  description text,
  status text NOT NULL DEFAULT 'novo',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.property_capture_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert capture leads" ON public.property_capture_leads
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Sellers can view own capture leads" ON public.property_capture_leads
  FOR SELECT TO authenticated USING (auth.uid() = seller_user_id);

CREATE POLICY "Sellers can update own capture leads" ON public.property_capture_leads
  FOR UPDATE TO authenticated USING (auth.uid() = seller_user_id);

CREATE POLICY "Sellers can delete own capture leads" ON public.property_capture_leads
  FOR DELETE TO authenticated USING (auth.uid() = seller_user_id);

CREATE POLICY "Admins can manage all capture leads" ON public.property_capture_leads
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_capture_leads_updated_at
  BEFORE UPDATE ON public.property_capture_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
