CREATE TABLE public.seller_crm_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  funnel_stage TEXT NOT NULL DEFAULT 'novo',
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own crm contacts"
ON public.seller_crm_contacts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Sellers can insert own crm contacts"
ON public.seller_crm_contacts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can update own crm contacts"
ON public.seller_crm_contacts FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Sellers can delete own crm contacts"
ON public.seller_crm_contacts FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all seller crm contacts"
ON public.seller_crm_contacts FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));