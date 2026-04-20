
-- 1) Function: generate unique seller slug from a name
CREATE OR REPLACE FUNCTION public.generate_seller_slug(p_name text, p_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 1;
BEGIN
  base_slug := lower(public.unaccent(coalesce(nullif(btrim(p_name), ''), 'corretor')));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  base_slug := left(base_slug, 60);
  base_slug := regexp_replace(base_slug, '-+$', '', 'g');
  IF base_slug = '' THEN base_slug := 'corretor'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug AND id <> p_profile_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$;

-- 2) Backfill: assign slug to every profile that doesn't have one
UPDATE public.profiles
SET slug = public.generate_seller_slug(coalesce(company_name, full_name), id)
WHERE slug IS NULL OR btrim(slug) = '';

-- 3) Trigger: set slug automatically on insert / when name changes and slug is empty
CREATE OR REPLACE FUNCTION public.set_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := public.generate_seller_slug(coalesce(NEW.company_name, NEW.full_name), NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_slug ON public.profiles;
CREATE TRIGGER profiles_set_slug
BEFORE INSERT OR UPDATE OF full_name, company_name, slug ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_profile_slug();
