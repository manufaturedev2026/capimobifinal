CREATE OR REPLACE FUNCTION public.auto_add_crm_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.crm_contacts (user_id, profile_id, full_name, phone, email, funnel_stage)
  SELECT
    NEW.user_id,
    NEW.id,
    COALESCE(NULLIF(btrim(NEW.full_name), ''), 'Sem nome'),
    NEW.phone,
    NEW.email,
    'novo'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.crm_contacts c
    WHERE c.user_id = NEW.user_id
       OR c.profile_id = NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_profile_add_crm_contact ON public.profiles;
CREATE TRIGGER on_new_profile_add_crm_contact
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_crm_contact();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_profile_id uuid;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, phone, city, state)
  SELECT
    NEW.id,
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''), split_part(COALESCE(NEW.email, ''), '@', 1), 'Novo usuário'),
    COALESCE(NEW.email, ''),
    NULLIF(btrim(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data->>'city'), ''),
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'state'), ''), 'ES')
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = NEW.id
  )
  RETURNING id INTO new_profile_id;

  IF new_profile_id IS NULL THEN
    SELECT p.id INTO new_profile_id
    FROM public.profiles p
    WHERE p.user_id = NEW.id
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (user_id, full_name, email, phone, city, state)
SELECT
  u.id,
  COALESCE(NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''), split_part(COALESCE(u.email, ''), '@', 1), 'Novo usuário'),
  COALESCE(u.email, ''),
  NULLIF(btrim(u.raw_user_meta_data->>'phone'), ''),
  NULLIF(btrim(u.raw_user_meta_data->>'city'), ''),
  COALESCE(NULLIF(btrim(u.raw_user_meta_data->>'state'), ''), 'ES')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

INSERT INTO public.crm_contacts (user_id, profile_id, full_name, phone, email, funnel_stage)
SELECT
  p.user_id,
  p.id,
  COALESCE(NULLIF(btrim(p.full_name), ''), 'Sem nome'),
  p.phone,
  p.email,
  'novo'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.crm_contacts c
  WHERE c.user_id = p.user_id
     OR c.profile_id = p.id
);