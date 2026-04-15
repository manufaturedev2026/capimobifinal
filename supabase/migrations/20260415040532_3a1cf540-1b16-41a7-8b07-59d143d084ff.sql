
CREATE OR REPLACE FUNCTION public.auto_add_crm_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if contact already exists for this user
  IF NOT EXISTS (SELECT 1 FROM public.crm_contacts WHERE user_id = NEW.user_id) THEN
    INSERT INTO public.crm_contacts (user_id, profile_id, full_name, phone, email, funnel_stage)
    VALUES (
      NEW.user_id,
      NEW.id,
      COALESCE(NEW.full_name, 'Sem nome'),
      NEW.phone,
      NEW.email,
      'novo'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_profile_add_crm_contact
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_crm_contact();
