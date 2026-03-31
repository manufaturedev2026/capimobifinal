
ALTER TABLE public.seller_stories
  ADD COLUMN team_member_id uuid REFERENCES public.team_members(id) ON DELETE CASCADE;
