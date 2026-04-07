
-- Enable unaccent
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public;

-- Add slug column
ALTER TABLE public.seller_items ADD COLUMN slug TEXT;

-- Unique index
CREATE UNIQUE INDEX idx_seller_items_slug ON public.seller_items(slug) WHERE slug IS NOT NULL;

-- Slug generation function
CREATE OR REPLACE FUNCTION public.generate_item_slug(p_title TEXT, p_item_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  base_slug := lower(public.unaccent(p_title));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  base_slug := left(base_slug, 80);
  base_slug := regexp_replace(base_slug, '-+$', '', 'g');
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.seller_items WHERE slug = final_slug AND id != p_item_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$;

-- Trigger function
CREATE OR REPLACE FUNCTION public.set_item_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.title IS DISTINCT FROM NEW.title) THEN
    NEW.slug := public.generate_item_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER trg_set_item_slug
BEFORE INSERT OR UPDATE ON public.seller_items
FOR EACH ROW
EXECUTE FUNCTION public.set_item_slug();

-- Backfill existing items
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, title FROM public.seller_items WHERE slug IS NULL ORDER BY created_at LOOP
    UPDATE public.seller_items SET slug = public.generate_item_slug(r.title, r.id) WHERE id = r.id;
  END LOOP;
END;
$$;
