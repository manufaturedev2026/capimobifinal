ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_ai_name text,
  ADD COLUMN IF NOT EXISTS whatsapp_ai_welcome text,
  ADD COLUMN IF NOT EXISTS whatsapp_ai_prompt text;