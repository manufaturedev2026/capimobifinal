
-- Add new fields to seller_crm_contacts
ALTER TABLE public.seller_crm_contacts
  ADD COLUMN IF NOT EXISTS lead_source text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS budget_min numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS budget_max numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS follow_up_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS interested_item_id uuid DEFAULT NULL;

-- Create activity log table
CREATE TABLE public.crm_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  description text NOT NULL,
  old_value text DEFAULT NULL,
  new_value text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs"
  ON public.crm_activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON public.crm_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity logs"
  ON public.crm_activity_log FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_crm_activity_contact ON public.crm_activity_log (contact_id, created_at DESC);
CREATE INDEX idx_crm_followup ON public.seller_crm_contacts (follow_up_date) WHERE follow_up_date IS NOT NULL;
