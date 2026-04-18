-- Tabela para corretores parceiros adicionarem imóveis de parceria às suas lojas
CREATE TABLE public.partner_store_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid NOT NULL REFERENCES public.property_partnerships(id) ON DELETE CASCADE,
  partner_user_id uuid NOT NULL,
  partner_profile_id uuid NOT NULL,
  item_id uuid NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(partnership_id, partner_user_id)
);

ALTER TABLE public.partner_store_listings ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode visualizar (necessário pra renderizar na loja pública do parceiro)
CREATE POLICY "Anyone can view partner store listings"
ON public.partner_store_listings
FOR SELECT
USING (true);

-- Apenas o parceiro dono do registro pode criar
CREATE POLICY "Partners can insert own listings"
ON public.partner_store_listings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = partner_user_id);

-- Apenas o parceiro dono pode atualizar (toggle visibilidade)
CREATE POLICY "Partners can update own listings"
ON public.partner_store_listings
FOR UPDATE
TO authenticated
USING (auth.uid() = partner_user_id);

-- Apenas o parceiro dono pode remover
CREATE POLICY "Partners can delete own listings"
ON public.partner_store_listings
FOR DELETE
TO authenticated
USING (auth.uid() = partner_user_id);

-- Admins gerenciam tudo
CREATE POLICY "Admins manage all partner store listings"
ON public.partner_store_listings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger atualizar updated_at
CREATE TRIGGER update_partner_store_listings_updated_at
BEFORE UPDATE ON public.partner_store_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pra performance
CREATE INDEX idx_partner_store_listings_partner ON public.partner_store_listings(partner_user_id, is_visible);
CREATE INDEX idx_partner_store_listings_item ON public.partner_store_listings(item_id);