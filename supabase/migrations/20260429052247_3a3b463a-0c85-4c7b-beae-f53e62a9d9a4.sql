
-- Tabela de cupons de desconto
CREATE TABLE public.discount_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  applies_to TEXT NOT NULL DEFAULT 'all', -- 'all', 'monthly', 'annual'
  applicable_tiers TEXT[] DEFAULT NULL, -- NULL = todos os planos
  max_uses INTEGER, -- NULL = ilimitado
  uses_count INTEGER NOT NULL DEFAULT 0,
  valid_until TIMESTAMP WITH TIME ZONE, -- NULL = sem expiração
  is_active BOOLEAN NOT NULL DEFAULT true,
  stripe_coupon_id TEXT, -- ID do coupon criado no Stripe (opcional, para sync)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_discount_coupons_code ON public.discount_coupons(code);
CREATE INDEX idx_discount_coupons_active ON public.discount_coupons(is_active);

ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- Admins gerenciam tudo
CREATE POLICY "Admins manage discount coupons"
  ON public.discount_coupons
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Qualquer um pode ler cupons ativos (para validar no checkout)
CREATE POLICY "Anyone can read active coupons"
  ON public.discount_coupons
  FOR SELECT
  TO public
  USING (is_active = true);

-- Trigger para updated_at
CREATE TRIGGER update_discount_coupons_updated_at
  BEFORE UPDATE ON public.discount_coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de uso de cupons (auditoria)
CREATE TABLE public.coupon_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.discount_coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tier TEXT NOT NULL,
  billing_period TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' ou 'annual'
  discount_percent INTEGER NOT NULL,
  stripe_session_id TEXT,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all redemptions"
  ON public.coupon_redemptions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own redemptions"
  ON public.coupon_redemptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own redemptions"
  ON public.coupon_redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Setting global do desconto anual (default 20%)
INSERT INTO public.platform_settings (key, value)
VALUES ('annual_discount_percent', '20')
ON CONFLICT (key) DO NOTHING;
