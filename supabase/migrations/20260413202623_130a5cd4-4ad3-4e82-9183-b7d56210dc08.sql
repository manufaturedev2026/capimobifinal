ALTER TABLE public.seller_crm_contacts
ADD COLUMN team_member_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL DEFAULT NULL;