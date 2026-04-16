
-- Add partnership fields to seller_items
ALTER TABLE public.seller_items
ADD COLUMN IF NOT EXISTS partnership_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS commission_percent numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS partner_percent numeric DEFAULT NULL;

-- Create property partnerships table
CREATE TABLE public.property_partnerships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.seller_items(id) ON DELETE CASCADE,
  requester_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL,
  owner_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_partnerships ENABLE ROW LEVEL SECURITY;

-- Owners can view partnerships on their items
CREATE POLICY "Owners can view received partnerships"
ON public.property_partnerships FOR SELECT
TO authenticated
USING (auth.uid() = owner_user_id);

-- Requesters can view their own partnerships
CREATE POLICY "Requesters can view own partnerships"
ON public.property_partnerships FOR SELECT
TO authenticated
USING (auth.uid() = requester_user_id);

-- Authenticated users can request partnerships
CREATE POLICY "Users can insert partnerships"
ON public.property_partnerships FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_user_id);

-- Owners can update (approve/reject) partnerships
CREATE POLICY "Owners can update partnerships"
ON public.property_partnerships FOR UPDATE
TO authenticated
USING (auth.uid() = owner_user_id);

-- Requesters can delete their own pending partnerships
CREATE POLICY "Requesters can delete own partnerships"
ON public.property_partnerships FOR DELETE
TO authenticated
USING (auth.uid() = requester_user_id AND status = 'pendente');

-- Admins can manage all
CREATE POLICY "Admins can manage all partnerships"
ON public.property_partnerships FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for performance
CREATE INDEX idx_property_partnerships_item ON public.property_partnerships(item_id);
CREATE INDEX idx_property_partnerships_requester ON public.property_partnerships(requester_user_id);
CREATE INDEX idx_property_partnerships_owner ON public.property_partnerships(owner_user_id);
CREATE INDEX idx_property_partnerships_status ON public.property_partnerships(status);
CREATE INDEX idx_seller_items_partnership ON public.seller_items(partnership_enabled) WHERE partnership_enabled = true;

-- Trigger for updated_at
CREATE TRIGGER update_property_partnerships_updated_at
BEFORE UPDATE ON public.property_partnerships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
