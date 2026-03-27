
-- Gamification rewards table
CREATE TABLE public.seller_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reward_type text NOT NULL, -- 'black_tag_24h', 'destaque_24h'
  trigger_type text NOT NULL, -- 'views_milestone', 'profile_complete', 'first_listing', 'listings_milestone'
  trigger_value text, -- e.g. '100 views', 'profile completed'
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rewards" ON public.seller_rewards FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own rewards" ON public.seller_rewards FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rewards" ON public.seller_rewards FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage rewards" ON public.seller_rewards FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
