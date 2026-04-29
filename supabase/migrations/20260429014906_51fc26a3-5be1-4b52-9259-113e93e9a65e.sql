
CREATE TABLE public.ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  seller_id uuid,
  tool_key text NOT NULL,
  visitor_key text NOT NULL,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_chat_sessions_lookup
  ON public.ai_chat_sessions (user_id, tool_key, visitor_key, last_activity_at DESC);

ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages chat sessions"
  ON public.ai_chat_sessions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users view own chat sessions"
  ON public.ai_chat_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
