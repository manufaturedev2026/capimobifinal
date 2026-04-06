-- Change expires_at default to 100 years from now (effectively no expiration)
ALTER TABLE public.store_effects ALTER COLUMN expires_at SET DEFAULT (now() + interval '100 years');

-- Update all currently active effects to not expire
UPDATE public.store_effects SET expires_at = now() + interval '100 years' WHERE is_active = true;