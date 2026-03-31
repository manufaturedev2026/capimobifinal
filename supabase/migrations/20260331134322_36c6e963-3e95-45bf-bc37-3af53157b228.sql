
-- Create seller_stories table
CREATE TABLE public.seller_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.seller_stories ENABLE ROW LEVEL SECURITY;

-- Anyone can view active stories
CREATE POLICY "Anyone can view active stories"
  ON public.seller_stories FOR SELECT
  TO public
  USING (is_active = true AND expires_at > now());

-- Sellers can insert own stories
CREATE POLICY "Sellers can insert own stories"
  ON public.seller_stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Sellers can delete own stories
CREATE POLICY "Sellers can delete own stories"
  ON public.seller_stories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all stories
CREATE POLICY "Admins can manage stories"
  ON public.seller_stories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast querying active stories
CREATE INDEX idx_seller_stories_active ON public.seller_stories (expires_at) WHERE is_active = true;
CREATE INDEX idx_seller_stories_seller ON public.seller_stories (seller_id);
