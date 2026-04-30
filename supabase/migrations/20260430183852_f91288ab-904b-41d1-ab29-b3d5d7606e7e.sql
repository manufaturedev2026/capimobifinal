DROP TRIGGER IF EXISTS funnel_day0_after_profile_insert ON public.profiles;
DROP FUNCTION IF EXISTS public.trigger_funnel_day0_on_new_profile();