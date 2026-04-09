CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_profile_id uuid;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, phone, city, state)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'city', NULL),
    COALESCE(NEW.raw_user_meta_data->>'state', 'ES')
  )
  RETURNING id INTO new_profile_id;

  -- Auto-create Premium subscription
  INSERT INTO public.seller_subscriptions (user_id, seller_id, tier, max_items, started_at, expires_at, is_active, payment_method, payment_status)
  VALUES (
    NEW.id,
    new_profile_id,
    'premium',
    100,
    now(),
    now() + interval '365 days',
    true,
    'auto',
    'ativo'
  );

  RETURN NEW;
END;
$function$;