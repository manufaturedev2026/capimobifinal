-- Add columns to track which pushes were already sent for each visit
ALTER TABLE public.visit_appointments
  ADD COLUMN IF NOT EXISTS push_created_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS push_morning_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS push_hour_before_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_visit_appointments_push_lookup
  ON public.visit_appointments (visit_date, visit_time, status);

-- Trigger to call edge function when a new visit is created
CREATE OR REPLACE FUNCTION public.notify_agenda_visit_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text := 'https://foqavjauorrheuytpmtj.supabase.co/functions/v1/send-agenda-push';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvcWF2amF1b3JyaGV1eXRwbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTYyNTMsImV4cCI6MjA5MTI5MjI1M30.CxgdD1OqKjDY_DDU2Wzh5Ka8xlyAtIVF8C0pAijD01A';
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
$$;

DROP TRIGGER IF EXISTS trg_agenda_visit_created ON public.visit_appointments;
CREATE TRIGGER trg_agenda_visit_created
AFTER INSERT ON public.visit_appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_agenda_visit_created();

-- Cron job: every 15 minutes scan for due reminders
SELECT cron.unschedule('agenda-push-scan')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'agenda-push-scan');

SELECT cron.schedule(
  'agenda-push-scan',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://foqavjauorrheuytpmtj.supabase.co/functions/v1/send-agenda-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvcWF2amF1b3JyaGV1eXRwbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTYyNTMsImV4cCI6MjA5MTI5MjI1M30.CxgdD1OqKjDY_DDU2Wzh5Ka8xlyAtIVF8C0pAijD01A'
    ),
    body := jsonb_build_object('kind', 'scan')
  );
  $cron$
);