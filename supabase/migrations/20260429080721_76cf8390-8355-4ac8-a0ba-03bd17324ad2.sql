-- Enable pg_trgm extension first (required for trigram indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Speed up tier lookups by seller (used in every listing page)
CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_seller_active
  ON public.seller_subscriptions (seller_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_user_active
  ON public.seller_subscriptions (user_id)
  WHERE is_active = true;

-- Speed up "ativo + ordered by created_at" queries (Search, Home, SEO, Neighborhood)
CREATE INDEX IF NOT EXISTS idx_seller_items_status_created
  ON public.seller_items (status, created_at DESC)
  WHERE status = 'ativo';

-- Speed up finality filter (venda/aluguel)
CREATE INDEX IF NOT EXISTS idx_seller_items_finality_status
  ON public.seller_items (finality, status)
  WHERE status = 'ativo';

-- Speed up text search on title (ILIKE %query%)
CREATE INDEX IF NOT EXISTS idx_seller_items_title_trgm
  ON public.seller_items
  USING gin (title gin_trgm_ops)
  WHERE status = 'ativo';