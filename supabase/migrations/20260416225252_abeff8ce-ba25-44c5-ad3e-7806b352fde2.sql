
CREATE TABLE public.ai_text_generations_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  action TEXT NOT NULL DEFAULT 'generate_ad_copy',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_text_gen_user_date ON public.ai_text_generations_log (user_id, created_at DESC);

ALTER TABLE public.ai_text_generations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai generations"
ON public.ai_text_generations_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai generations"
ON public.ai_text_generations_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ai generations"
ON public.ai_text_generations_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
