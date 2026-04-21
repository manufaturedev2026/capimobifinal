-- 1) Add new value to visit_status enum
ALTER TYPE public.visit_status ADD VALUE IF NOT EXISTS 'pendente_confirmacao';

-- 2) Add tracking columns
ALTER TABLE public.visit_appointments
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS ai_match_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_property_guess TEXT;

CREATE INDEX IF NOT EXISTS idx_visit_appointments_source ON public.visit_appointments(source);
CREATE INDEX IF NOT EXISTS idx_visit_appointments_seller_status ON public.visit_appointments(seller_id, status);