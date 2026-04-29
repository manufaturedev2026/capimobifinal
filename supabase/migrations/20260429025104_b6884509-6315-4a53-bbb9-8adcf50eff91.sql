ALTER TABLE public.generated_contracts
ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_generated_contracts_user_favorite
ON public.generated_contracts(user_id, is_favorite) WHERE is_favorite = true;