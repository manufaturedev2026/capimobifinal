-- Allow public read of capture bot configs for the chat page
CREATE POLICY "Anyone can read capture bot configs"
ON public.platform_settings
FOR SELECT
TO anon
USING (key LIKE 'capture_bot_config_%');