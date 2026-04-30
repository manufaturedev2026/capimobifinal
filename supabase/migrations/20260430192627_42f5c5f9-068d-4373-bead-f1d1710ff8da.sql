CREATE OR REPLACE FUNCTION public.notify_agenda_visit_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_url text := 'https://lzjwmpwoybtdisenuzec.supabase.co/functions/v1/send-agenda-push';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6andtcHdveWJ0ZGlzZW51emVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MzQ2OTIsImV4cCI6MjA5MzAxMDY5Mn0.jXrjmhrbp6B3wgTviClSfb3izTPSCaPhrisnwa5rPfs';
BEGIN
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon
    ),
    body := jsonb_build_object(
      'visit_id', NEW.id::text,
      'kind', 'created'
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

-- Garante que o trigger existe e está ligado à tabela
DROP TRIGGER IF EXISTS trg_notify_agenda_visit_created ON public.visit_appointments;
CREATE TRIGGER trg_notify_agenda_visit_created
AFTER INSERT ON public.visit_appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_agenda_visit_created();