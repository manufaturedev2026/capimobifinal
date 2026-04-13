
-- Add origin and linked_profile_id to team_members
ALTER TABLE public.team_members
ADD COLUMN origin text NOT NULL DEFAULT 'manual',
ADD COLUMN linked_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_team_members_linked_profile ON public.team_members(linked_profile_id) WHERE linked_profile_id IS NOT NULL;
