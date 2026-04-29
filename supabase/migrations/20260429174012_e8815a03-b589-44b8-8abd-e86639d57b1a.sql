
-- Garante extensões
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1) Função que dispara o dia 0 quando um profile é criado
CREATE OR REPLACE FUNCTION public.trigger_funnel_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://lzjwmpwoybtdisenuzec.supabase.co/functions/v1/process-funnel-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6andtcHdveWJ0ZGlzZW51emVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MzQ2OTIsImV4cCI6MjA5MzAxMDY5Mn0.jXrjmhrbp6B3wgTviClSfb3izTPSCaPhrisnwa5rPfs'
      ),
      body := jsonb_build_object('profile_id', NEW.id, 'day_offset', 0)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Cria trigger no profiles (após insert)
DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON public.profiles;
CREATE TRIGGER on_profile_created_send_welcome
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_funnel_welcome_email();

-- 3) Agenda cron diário (10h UTC = 7h Brasília) para processar dias 1..6
SELECT cron.unschedule('process-funnel-emails-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-funnel-emails-daily');

SELECT cron.schedule(
  'process-funnel-emails-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://lzjwmpwoybtdisenuzec.supabase.co/functions/v1/process-funnel-emails',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6andtcHdveWJ0ZGlzZW51emVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MzQ2OTIsImV4cCI6MjA5MzAxMDY5Mn0.jXrjmhrbp6B3wgTviClSfb3izTPSCaPhrisnwa5rPfs"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
