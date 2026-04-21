CREATE TYPE public.visit_status AS ENUM ('confirmada', 'pendente', 'reagendada', 'cancelada', 'fechada');

CREATE TABLE public.visit_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  item_id UUID REFERENCES public.seller_items(id) ON DELETE SET NULL,
  property_type TEXT,
  property_code TEXT,
  address TEXT,
  city TEXT,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  responsible_name TEXT,
  status public.visit_status NOT NULL DEFAULT 'pendente',
  notes TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_visit_appointments_user ON public.visit_appointments(user_id);
CREATE INDEX idx_visit_appointments_seller ON public.visit_appointments(seller_id);
CREATE INDEX idx_visit_appointments_date ON public.visit_appointments(visit_date);
CREATE INDEX idx_visit_appointments_status ON public.visit_appointments(status);

ALTER TABLE public.visit_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own visits"
ON public.visit_appointments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert own visits"
ON public.visit_appointments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own visits"
ON public.visit_appointments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete own visits"
ON public.visit_appointments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Agency owners see visits of team members linked to their company profile.
-- A team member is linked to a real user via linked_profile_id -> profiles.id -> profiles.user_id.
CREATE POLICY "Agency owners can view team visits"
ON public.visit_appointments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.profiles agency ON agency.id = tm.company_id
    JOIN public.profiles member ON member.id = tm.linked_profile_id
    WHERE agency.user_id = auth.uid()
      AND member.user_id = visit_appointments.user_id
  )
);

CREATE POLICY "Admins manage all visits"
ON public.visit_appointments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_visit_appointments_updated_at
BEFORE UPDATE ON public.visit_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();