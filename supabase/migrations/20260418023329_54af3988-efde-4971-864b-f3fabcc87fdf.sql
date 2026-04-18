CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_profile_id uuid;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, phone, city, state, store_layout, store_theme)
  SELECT
    NEW.id,
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''), split_part(COALESCE(NEW.email, ''), '@', 1), 'Novo usuário'),
    COALESCE(NEW.email, ''),
    NULLIF(btrim(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data->>'city'), ''),
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'state'), ''), 'ES'),
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'store_layout'), ''), 'marketplace'),
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'store_theme'), ''), 'luxury')
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = NEW.id
  )
  RETURNING id INTO new_profile_id;

  RETURN NEW;
END;
$function$;

-- Backfill any existing profiles missing store_layout
UPDATE public.profiles
SET store_layout = 'marketplace'
WHERE store_layout IS NULL OR btrim(store_layout) = '';

UPDATE public.profiles
SET store_theme = 'luxury'
WHERE store_theme IS NULL OR btrim(store_theme) = '';