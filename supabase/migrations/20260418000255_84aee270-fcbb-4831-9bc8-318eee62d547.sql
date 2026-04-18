
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'gabrielcamarocolatina@gmail.com';

INSERT INTO public.profiles (user_id, full_name, email, phone, city, state)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', 'Gabriel Camaro'),
       u.email,
       u.raw_user_meta_data->>'phone',
       u.raw_user_meta_data->>'city',
       COALESCE(u.raw_user_meta_data->>'state', 'ES')
FROM auth.users u
WHERE u.email = 'gabrielcamarocolatina@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id);

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
