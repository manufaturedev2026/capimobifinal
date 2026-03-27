
CREATE TABLE public.store_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  user_id uuid NOT NULL,
  effect_type text NOT NULL,
  activated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour'),
  is_active boolean NOT NULL DEFAULT true,
  is_free boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.store_effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active effects" ON public.store_effects
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert own effects" ON public.store_effects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own effects" ON public.store_effects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
