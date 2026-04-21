-- ============================================
-- 1. Tabela de preços por m² (admin gerenciável)
-- ============================================
CREATE TABLE IF NOT EXISTS public.valuation_price_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estado text NOT NULL,
  cidade text,
  bairro text,
  tipo text NOT NULL,
  preco_m2 numeric NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice único parcial para garantir unicidade considerando NULLs
CREATE UNIQUE INDEX IF NOT EXISTS valuation_price_table_unique_idx
ON public.valuation_price_table (
  estado,
  COALESCE(cidade, ''),
  COALESCE(bairro, ''),
  tipo
);

CREATE INDEX IF NOT EXISTS valuation_price_table_lookup_idx
ON public.valuation_price_table (estado, cidade, tipo);

ALTER TABLE public.valuation_price_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price table"
ON public.valuation_price_table FOR SELECT
USING (true);

CREATE POLICY "Admins manage price table"
ON public.valuation_price_table FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_valuation_price_table_updated_at
BEFORE UPDATE ON public.valuation_price_table
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. Histórico de avaliações
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  estado text NOT NULL,
  cidade text NOT NULL,
  bairro text NOT NULL,
  rua text,
  cep text,
  tipo text NOT NULL,
  area_total numeric,
  area_construida numeric,
  quartos integer,
  banheiros integer,
  suites integer,
  garagem integer,
  extras text[] DEFAULT '{}',
  acabamento text,
  conservacao text,
  documentacao text[] DEFAULT '{}',
  preco_m2_usado numeric,
  valor_base numeric,
  ajuste_total_pct numeric,
  valor_estimado numeric NOT NULL,
  faixa_min numeric,
  faixa_max numeric,
  venda_rapida numeric,
  venda_premium numeric,
  tempo_medio_venda_dias integer,
  justificativa text,
  breakdown jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_valuations_user_idx
ON public.property_valuations (user_id, created_at DESC);

ALTER TABLE public.property_valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own valuations"
ON public.property_valuations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone insert valuations"
ON public.property_valuations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users delete own valuations"
ON public.property_valuations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all valuations"
ON public.property_valuations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 3. Pré-popular preços por m² (ES + capitais)
-- ============================================

-- Fallback nacional por tipo (estado vazio sinaliza fallback)
INSERT INTO public.valuation_price_table (estado, cidade, bairro, tipo, preco_m2, notes) VALUES
('_DEFAULT', NULL, NULL, 'Casa', 3500, 'Fallback nacional'),
('_DEFAULT', NULL, NULL, 'Apartamento', 5500, 'Fallback nacional'),
('_DEFAULT', NULL, NULL, 'Terreno', 800, 'Fallback nacional'),
('_DEFAULT', NULL, NULL, 'Comercial', 6000, 'Fallback nacional'),
('_DEFAULT', NULL, NULL, 'Rural', 50, 'Fallback nacional')
ON CONFLICT DO NOTHING;

-- Médias por estado (ES detalhado)
INSERT INTO public.valuation_price_table (estado, cidade, bairro, tipo, preco_m2) VALUES
('ES', NULL, NULL, 'Casa', 4200),
('ES', NULL, NULL, 'Apartamento', 6500),
('ES', NULL, NULL, 'Terreno', 1100),
('ES', NULL, NULL, 'Comercial', 7500),
('ES', NULL, NULL, 'Rural', 60),
('SP', NULL, NULL, 'Casa', 6800),
('SP', NULL, NULL, 'Apartamento', 9500),
('SP', NULL, NULL, 'Terreno', 2200),
('SP', NULL, NULL, 'Comercial', 11000),
('SP', NULL, NULL, 'Rural', 80),
('RJ', NULL, NULL, 'Casa', 6200),
('RJ', NULL, NULL, 'Apartamento', 9800),
('RJ', NULL, NULL, 'Terreno', 2000),
('RJ', NULL, NULL, 'Comercial', 10500),
('RJ', NULL, NULL, 'Rural', 70),
('MG', NULL, NULL, 'Casa', 4500),
('MG', NULL, NULL, 'Apartamento', 6200),
('MG', NULL, NULL, 'Terreno', 1300),
('MG', NULL, NULL, 'Comercial', 7000),
('MG', NULL, NULL, 'Rural', 55),
('BA', NULL, NULL, 'Casa', 3800),
('BA', NULL, NULL, 'Apartamento', 5800),
('BA', NULL, NULL, 'Terreno', 900),
('BA', NULL, NULL, 'Comercial', 6500),
('BA', NULL, NULL, 'Rural', 45),
('PR', NULL, NULL, 'Casa', 5200),
('PR', NULL, NULL, 'Apartamento', 7200),
('PR', NULL, NULL, 'Terreno', 1500),
('PR', NULL, NULL, 'Comercial', 8000),
('PR', NULL, NULL, 'Rural', 65),
('SC', NULL, NULL, 'Casa', 6000),
('SC', NULL, NULL, 'Apartamento', 8500),
('SC', NULL, NULL, 'Terreno', 1800),
('SC', NULL, NULL, 'Comercial', 9500),
('SC', NULL, NULL, 'Rural', 75),
('RS', NULL, NULL, 'Casa', 4800),
('RS', NULL, NULL, 'Apartamento', 6800),
('RS', NULL, NULL, 'Terreno', 1400),
('RS', NULL, NULL, 'Comercial', 7500),
('RS', NULL, NULL, 'Rural', 60),
('GO', NULL, NULL, 'Casa', 4000),
('GO', NULL, NULL, 'Apartamento', 5500),
('GO', NULL, NULL, 'Terreno', 1000),
('GO', NULL, NULL, 'Comercial', 6500),
('PE', NULL, NULL, 'Casa', 3900),
('PE', NULL, NULL, 'Apartamento', 6000),
('CE', NULL, NULL, 'Casa', 3700),
('CE', NULL, NULL, 'Apartamento', 5800),
('DF', NULL, NULL, 'Casa', 7500),
('DF', NULL, NULL, 'Apartamento', 9000),
('DF', NULL, NULL, 'Terreno', 2500)
ON CONFLICT DO NOTHING;

-- Cidades principais ES (média por cidade)
INSERT INTO public.valuation_price_table (estado, cidade, bairro, tipo, preco_m2) VALUES
('ES', 'Vitória', NULL, 'Casa', 6500),
('ES', 'Vitória', NULL, 'Apartamento', 9500),
('ES', 'Vitória', NULL, 'Terreno', 2800),
('ES', 'Vitória', NULL, 'Comercial', 11000),
('ES', 'Vila Velha', NULL, 'Casa', 5200),
('ES', 'Vila Velha', NULL, 'Apartamento', 7800),
('ES', 'Vila Velha', NULL, 'Terreno', 1900),
('ES', 'Vila Velha', NULL, 'Comercial', 8500),
('ES', 'Serra', NULL, 'Casa', 3800),
('ES', 'Serra', NULL, 'Apartamento', 5500),
('ES', 'Serra', NULL, 'Terreno', 1100),
('ES', 'Serra', NULL, 'Comercial', 6500),
('ES', 'Cariacica', NULL, 'Casa', 3200),
('ES', 'Cariacica', NULL, 'Apartamento', 4800),
('ES', 'Cariacica', NULL, 'Terreno', 900),
('ES', 'Colatina', NULL, 'Casa', 3500),
('ES', 'Colatina', NULL, 'Apartamento', 5200),
('ES', 'Colatina', NULL, 'Terreno', 1000),
('ES', 'Colatina', NULL, 'Comercial', 6500),
('ES', 'Linhares', NULL, 'Casa', 3300),
('ES', 'Linhares', NULL, 'Apartamento', 4900),
('ES', 'Linhares', NULL, 'Terreno', 850),
('ES', 'Cachoeiro de Itapemirim', NULL, 'Casa', 3200),
('ES', 'Cachoeiro de Itapemirim', NULL, 'Apartamento', 4700),
('ES', 'Guarapari', NULL, 'Casa', 4500),
('ES', 'Guarapari', NULL, 'Apartamento', 7000),
('ES', 'Guarapari', NULL, 'Terreno', 1600),
('ES', 'São Mateus', NULL, 'Casa', 2900),
('ES', 'São Mateus', NULL, 'Apartamento', 4200),
('ES', 'Aracruz', NULL, 'Casa', 3400),
('ES', 'Aracruz', NULL, 'Apartamento', 5000),
('ES', 'Anchieta', NULL, 'Casa', 4000),
('ES', 'Domingos Martins', NULL, 'Casa', 3800),
('ES', 'Itapemirim', NULL, 'Casa', 3200),
('ES', 'Marataízes', NULL, 'Casa', 3600),
('ES', 'Nova Venécia', NULL, 'Casa', 2800)
ON CONFLICT DO NOTHING;

-- Bairros nobres de Vitória/ES (exemplos)
INSERT INTO public.valuation_price_table (estado, cidade, bairro, tipo, preco_m2) VALUES
('ES', 'Vitória', 'Praia do Canto', 'Apartamento', 13500),
('ES', 'Vitória', 'Praia do Canto', 'Casa', 9500),
('ES', 'Vitória', 'Barro Vermelho', 'Apartamento', 11000),
('ES', 'Vitória', 'Mata da Praia', 'Apartamento', 12000),
('ES', 'Vitória', 'Mata da Praia', 'Casa', 8500),
('ES', 'Vitória', 'Jardim Camburi', 'Apartamento', 8500),
('ES', 'Vitória', 'Jardim da Penha', 'Apartamento', 9800),
('ES', 'Vitória', 'Enseada do Suá', 'Apartamento', 11500),
('ES', 'Vitória', 'Centro', 'Apartamento', 5500),
('ES', 'Vitória', 'Bento Ferreira', 'Apartamento', 8200),
('ES', 'Vila Velha', 'Praia da Costa', 'Apartamento', 10500),
('ES', 'Vila Velha', 'Itapuã', 'Apartamento', 9000),
('ES', 'Vila Velha', 'Itaparica', 'Apartamento', 8800),
('ES', 'Vila Velha', 'Coqueiral de Itaparica', 'Apartamento', 7500),
('ES', 'Vila Velha', 'Centro', 'Apartamento', 5500),
('ES', 'Serra', 'Laranjeiras', 'Apartamento', 6500),
('ES', 'Serra', 'Manguinhos', 'Apartamento', 7800),
('ES', 'Serra', 'Jacaraípe', 'Casa', 3500),
('ES', 'Colatina', 'Centro', 'Casa', 4200),
('ES', 'Colatina', 'Centro', 'Apartamento', 6000),
('ES', 'Colatina', 'São Silvano', 'Casa', 3800),
('ES', 'Colatina', 'Maria das Graças', 'Casa', 3600),
('ES', 'Guarapari', 'Centro', 'Apartamento', 8500),
('ES', 'Guarapari', 'Praia do Morro', 'Apartamento', 9500)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. Função RPC para resolver preço m² com fallback
-- ============================================
CREATE OR REPLACE FUNCTION public.resolve_price_per_sqm(
  p_estado text,
  p_cidade text,
  p_bairro text,
  p_tipo text
)
RETURNS TABLE(preco_m2 numeric, source text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preco numeric;
  v_source text;
BEGIN
  -- 1. Tentar bairro exato
  SELECT vpt.preco_m2 INTO v_preco
  FROM public.valuation_price_table vpt
  WHERE vpt.estado = p_estado
    AND lower(vpt.cidade) = lower(p_cidade)
    AND lower(vpt.bairro) = lower(p_bairro)
    AND vpt.tipo = p_tipo
  LIMIT 1;

  IF v_preco IS NOT NULL THEN
    RETURN QUERY SELECT v_preco, 'bairro'::text;
    RETURN;
  END IF;

  -- 2. Média da cidade
  SELECT vpt.preco_m2 INTO v_preco
  FROM public.valuation_price_table vpt
  WHERE vpt.estado = p_estado
    AND lower(vpt.cidade) = lower(p_cidade)
    AND vpt.bairro IS NULL
    AND vpt.tipo = p_tipo
  LIMIT 1;

  IF v_preco IS NOT NULL THEN
    RETURN QUERY SELECT v_preco, 'cidade'::text;
    RETURN;
  END IF;

  -- 3. Média do estado
  SELECT vpt.preco_m2 INTO v_preco
  FROM public.valuation_price_table vpt
  WHERE vpt.estado = p_estado
    AND vpt.cidade IS NULL
    AND vpt.bairro IS NULL
    AND vpt.tipo = p_tipo
  LIMIT 1;

  IF v_preco IS NOT NULL THEN
    RETURN QUERY SELECT v_preco, 'estado'::text;
    RETURN;
  END IF;

  -- 4. Fallback nacional
  SELECT vpt.preco_m2 INTO v_preco
  FROM public.valuation_price_table vpt
  WHERE vpt.estado = '_DEFAULT'
    AND vpt.tipo = p_tipo
  LIMIT 1;

  IF v_preco IS NOT NULL THEN
    RETURN QUERY SELECT v_preco, 'nacional'::text;
    RETURN;
  END IF;

  -- 5. Default seguro
  RETURN QUERY SELECT 3500::numeric, 'default'::text;
END;
$$;