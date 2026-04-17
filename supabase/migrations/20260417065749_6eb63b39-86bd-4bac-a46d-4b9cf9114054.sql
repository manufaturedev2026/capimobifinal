-- Enable pgcrypto for password encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- SMTP settings table (single row, admin only)
CREATE TABLE public.smtp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  sender_name text NOT NULL DEFAULT '',
  sender_email text NOT NULL DEFAULT '',
  host text NOT NULL DEFAULT 'smtp.hostinger.com',
  port integer NOT NULL DEFAULT 465,
  security text NOT NULL DEFAULT 'ssl' CHECK (security IN ('ssl','tls','none')),
  username text NOT NULL DEFAULT '',
  password_encrypted text,
  reply_to text,
  use_for_signup boolean NOT NULL DEFAULT true,
  use_for_recovery boolean NOT NULL DEFAULT true,
  last_test_at timestamptz,
  last_test_status text,
  last_test_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage smtp_settings"
  ON public.smtp_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER smtp_settings_set_updated_at
BEFORE UPDATE ON public.smtp_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default row
INSERT INTO public.smtp_settings (host, port, security) VALUES ('smtp.hostinger.com', 465, 'ssl');

-- Email logs
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  error_message text,
  context text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view email_logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete email_logs"
  ON public.email_logs FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX email_logs_created_at_idx ON public.email_logs (created_at DESC);

-- Encryption helpers (use SUPABASE_DB_URL secret as key surrogate via vault not available; use a pgcrypto static key stored in settings)
-- We'll keep a server-side key via a secret param accessed only by SECURITY DEFINER functions.
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password(p_password text, p_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_password IS NULL OR p_password = '' THEN
    RETURN NULL;
  END IF;
  RETURN encode(pgp_sym_encrypt(p_password, p_key), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_smtp_password(p_encrypted text, p_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_encrypted IS NULL OR p_encrypted = '' THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(decode(p_encrypted, 'base64'), p_key);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.encrypt_smtp_password(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_smtp_password(text, text) FROM PUBLIC, anon, authenticated;