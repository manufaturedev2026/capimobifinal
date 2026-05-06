-- Add support for fixed-amount discount coupons (R$) alongside percent
ALTER TABLE public.discount_coupons
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS discount_amount_cents integer;

ALTER TABLE public.discount_coupons
  DROP CONSTRAINT IF EXISTS discount_coupons_discount_percent_check;

ALTER TABLE public.discount_coupons
  ALTER COLUMN discount_percent DROP NOT NULL;

ALTER TABLE public.discount_coupons
  ADD CONSTRAINT discount_coupons_type_check CHECK (discount_type IN ('percent','fixed'));

ALTER TABLE public.discount_coupons
  ADD CONSTRAINT discount_coupons_value_check CHECK (
    (discount_type = 'percent' AND discount_percent IS NOT NULL AND discount_percent > 0 AND discount_percent <= 100)
    OR
    (discount_type = 'fixed' AND discount_amount_cents IS NOT NULL AND discount_amount_cents > 0)
  );

-- Track redemptions amount in cents
ALTER TABLE public.coupon_redemptions
  ADD COLUMN IF NOT EXISTS discount_amount_cents integer;