ALTER TABLE public.founder_lots ADD COLUMN IF NOT EXISTS ia_credits_monthly integer NOT NULL DEFAULT 0;
UPDATE public.founder_lots SET ia_credits_monthly = 750 WHERE category = 'corretor';
UPDATE public.founder_lots SET ia_credits_monthly = 3000 WHERE category = 'empresa';
UPDATE public.founder_lots SET ia_credits_monthly = 5000 WHERE category = 'construtora';