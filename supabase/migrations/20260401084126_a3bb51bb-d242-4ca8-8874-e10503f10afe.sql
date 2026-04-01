
-- Enum para status de captação
CREATE TYPE public.capture_status AS ENUM ('disponivel', 'em_negociacao', 'vendido');

-- Tabela de captações: rastreia quais corretores pegaram quais imóveis
CREATE TABLE public.property_captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.seller_items(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status capture_status NOT NULL DEFAULT 'em_negociacao',
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(item_id, broker_id)
);

-- Adicionar campo capture_status aos seller_items  
ALTER TABLE public.seller_items 
  ADD COLUMN IF NOT EXISTS capture_status capture_status DEFAULT 'disponivel',
  ADD COLUMN IF NOT EXISTS owner_phone TEXT,
  ADD COLUMN IF NOT EXISTS is_owner_listing BOOLEAN DEFAULT false;

-- RLS para property_captures
ALTER TABLE public.property_captures ENABLE ROW LEVEL SECURITY;

-- Corretores podem ver suas próprias captações
CREATE POLICY "Brokers can view own captures"
  ON public.property_captures FOR SELECT
  TO authenticated
  USING (broker_user_id = auth.uid());

-- Corretores podem inserir captações (verificação de plano no código)
CREATE POLICY "Brokers can insert captures"
  ON public.property_captures FOR INSERT
  TO authenticated
  WITH CHECK (broker_user_id = auth.uid());

-- Corretores podem atualizar status das suas captações
CREATE POLICY "Brokers can update own captures"
  ON public.property_captures FOR UPDATE
  TO authenticated
  USING (broker_user_id = auth.uid());

-- Admins podem ver e gerenciar todas as captações
CREATE POLICY "Admins can manage all captures"
  ON public.property_captures FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Proprietários podem ver captações dos seus imóveis
CREATE POLICY "Owners can view captures of their items"
  ON public.property_captures FOR SELECT
  TO authenticated
  USING (item_id IN (
    SELECT id FROM public.seller_items WHERE user_id = auth.uid()
  ));
