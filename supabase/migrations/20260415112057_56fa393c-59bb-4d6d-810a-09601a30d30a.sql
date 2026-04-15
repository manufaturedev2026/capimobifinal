CREATE POLICY "Anyone can insert crm contacts from invite"
ON public.crm_contacts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);