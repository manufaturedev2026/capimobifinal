-- Trigger function: invoke process-funnel-emails for the new profile, day_offset=0
CREATE OR REPLACE FUNCTION public.trigger_funnel_day0_on_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_anon text;
BEGIN
  -- Build function URL from project ref (hardcoded for this project)
  v_url := 'https://foqavjauorrheuytpmtj.supabase.co/functions/v1/process-funnel-emails';
  v_anon := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvcWF2amF1b3JyaGV1eXRwbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTYyNTMsImV4cCI6MjA5MTI5MjI1M30.CxgdD1OqKjDY_DDU2Wzh5Ka8xlyAtIVF8C0pAijD01A';

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon
    ),
    body := jsonb_build_object(
      'profile_id', NEW.id::text,
      'day_offset', 0
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block profile creation if HTTP call fails
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS funnel_day0_after_profile_insert ON public.profiles;
CREATE TRIGGER funnel_day0_after_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_funnel_day0_on_new_profile();