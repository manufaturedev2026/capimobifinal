
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (seller_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can insert push subscriptions"
ON public.push_subscriptions
FOR INSERT
TO public
WITH CHECK (true);

-- Sellers can view their own subscriptions
CREATE POLICY "Sellers can view own push subscriptions"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (seller_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Admins can view all
CREATE POLICY "Admins can view all push subscriptions"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Sellers can delete own subscriptions (cleanup invalid ones)
CREATE POLICY "Sellers can delete own push subscriptions"
ON public.push_subscriptions
FOR DELETE
TO authenticated
USING (seller_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Also create a push notification log
CREATE TABLE public.push_notifications_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  url text,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.push_notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own notification logs"
ON public.push_notifications_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Sellers can insert own notification logs"
ON public.push_notifications_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
