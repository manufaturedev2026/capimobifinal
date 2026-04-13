
-- Allow anyone (including anonymous visitors) to insert leads into seller_crm_contacts
CREATE POLICY "Anyone can insert lead contacts"
ON public.seller_crm_contacts
FOR INSERT
TO public
WITH CHECK (true);
