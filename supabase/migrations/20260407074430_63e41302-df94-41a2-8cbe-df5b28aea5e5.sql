CREATE POLICY "Anyone can select push subscriptions for upsert"
ON public.push_subscriptions
FOR SELECT
TO anon, authenticated
USING (true);