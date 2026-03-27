ALTER TABLE public.profiles ADD COLUMN slug text UNIQUE;
CREATE INDEX idx_profiles_slug ON public.profiles(slug) WHERE slug IS NOT NULL;