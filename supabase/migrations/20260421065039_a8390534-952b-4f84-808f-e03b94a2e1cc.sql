-- Adiciona campo de status de listagem para distinguir anúncios reais de demos/testes
DO $$ BEGIN
  CREATE TYPE public.listing_status AS ENUM ('publicado','vendido','alugado','demo','teste','rascunho','oculto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.seller_items
  ADD COLUMN IF NOT EXISTS listing_status public.listing_status NOT NULL DEFAULT 'publicado';

-- Marca como 'publicado' tudo que estiver ativo, e como 'vendido' itens com sold_at
UPDATE public.seller_items
  SET listing_status = 'vendido'
  WHERE sold_at IS NOT NULL AND listing_status = 'publicado';

CREATE INDEX IF NOT EXISTS idx_seller_items_listing_status
  ON public.seller_items(listing_status);

CREATE INDEX IF NOT EXISTS idx_seller_items_market_lookup
  ON public.seller_items(state, city, category, listing_status)
  WHERE listing_status IN ('publicado','vendido','alugado');