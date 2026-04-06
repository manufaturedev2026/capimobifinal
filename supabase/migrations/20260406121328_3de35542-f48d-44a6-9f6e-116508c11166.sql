
-- Enum for contract status
CREATE TYPE public.rental_contract_status AS ENUM ('ativo', 'encerrado', 'cancelado', 'renovacao');

-- Enum for payment status
CREATE TYPE public.rental_payment_status AS ENUM ('pago', 'pendente', 'atrasado', 'parcial');

-- Enum for reminder type
CREATE TYPE public.rental_reminder_type AS ENUM ('antes_vencimento', 'no_vencimento', 'atrasado');

-- ══════════════════════════════════════
-- RENTAL CONTRACTS
-- ══════════════════════════════════════
CREATE TABLE public.rental_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  item_id UUID REFERENCES public.seller_items(id) ON DELETE SET NULL,
  tenant_name TEXT NOT NULL,
  tenant_cpf_cnpj TEXT,
  tenant_phone TEXT,
  tenant_email TEXT,
  rent_amount NUMERIC NOT NULL DEFAULT 0,
  due_day INTEGER NOT NULL DEFAULT 10,
  late_fee_percent NUMERIC DEFAULT 2,
  daily_interest_percent NUMERIC DEFAULT 0.033,
  start_date DATE NOT NULL,
  end_date DATE,
  status rental_contract_status NOT NULL DEFAULT 'ativo',
  notes TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rental contracts" ON public.rental_contracts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rental contracts" ON public.rental_contracts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rental contracts" ON public.rental_contracts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rental contracts" ON public.rental_contracts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_rental_contracts_updated_at BEFORE UPDATE ON public.rental_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════
-- RENTAL PAYMENTS
-- ══════════════════════════════════════
CREATE TABLE public.rental_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contract_id UUID NOT NULL REFERENCES public.rental_contracts(id) ON DELETE CASCADE,
  reference_month TEXT NOT NULL,
  amount_due NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  late_fee NUMERIC DEFAULT 0,
  interest NUMERIC DEFAULT 0,
  total_due NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  status rental_payment_status NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rental_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rental payments" ON public.rental_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rental payments" ON public.rental_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rental payments" ON public.rental_payments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rental payments" ON public.rental_payments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_rental_payments_updated_at BEFORE UPDATE ON public.rental_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════
-- RENTAL REMINDERS
-- ══════════════════════════════════════
CREATE TABLE public.rental_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contract_id UUID NOT NULL REFERENCES public.rental_contracts(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.rental_payments(id) ON DELETE CASCADE,
  reminder_type rental_reminder_type NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  sent_at TIMESTAMPTZ,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rental_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rental reminders" ON public.rental_reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rental reminders" ON public.rental_reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rental reminders" ON public.rental_reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rental reminders" ON public.rental_reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);
