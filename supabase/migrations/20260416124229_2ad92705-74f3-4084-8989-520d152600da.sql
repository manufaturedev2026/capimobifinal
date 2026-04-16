
CREATE TABLE public.invite_funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  session_id text NOT NULL,
  user_agent text,
  referrer text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert funnel events"
  ON public.invite_funnel_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view funnel events"
  ON public.invite_funnel_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_invite_funnel_events_type ON public.invite_funnel_events(event_type);
CREATE INDEX idx_invite_funnel_events_created ON public.invite_funnel_events(created_at);
CREATE INDEX idx_invite_funnel_events_session ON public.invite_funnel_events(session_id);
