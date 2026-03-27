
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  creci text,
  email text,
  photo_url text,
  bio text,
  slug text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, slug)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Anyone can view active team members (for store pages)
CREATE POLICY "Anyone can view team members"
  ON public.team_members FOR SELECT
  TO public
  USING (true);

-- Company owner can insert team members
CREATE POLICY "Company owner can insert team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Company owner can update team members
CREATE POLICY "Company owner can update team members"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (
    company_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Company owner can delete team members
CREATE POLICY "Company owner can delete team members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    company_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Admins full access
CREATE POLICY "Admins can manage team members"
  ON public.team_members FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
