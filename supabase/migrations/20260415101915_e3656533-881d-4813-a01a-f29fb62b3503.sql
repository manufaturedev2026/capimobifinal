-- Allow sellers to insert their own capture bot config
CREATE POLICY "Sellers can insert own capture bot config"
ON public.platform_settings
FOR INSERT
TO authenticated
WITH CHECK (key LIKE 'capture_bot_config_%');

-- Allow sellers to update their own capture bot config
CREATE POLICY "Sellers can update own capture bot config"
ON public.platform_settings
FOR UPDATE
TO authenticated
USING (key LIKE 'capture_bot_config_%')
WITH CHECK (key LIKE 'capture_bot_config_%');

-- Allow sellers to read their own capture bot config
CREATE POLICY "Sellers can read own capture bot config"
ON public.platform_settings
FOR SELECT
TO authenticated
USING (key LIKE 'capture_bot_config_%');