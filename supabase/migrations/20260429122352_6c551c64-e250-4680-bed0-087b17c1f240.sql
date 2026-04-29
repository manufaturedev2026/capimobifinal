-- Adiciona campos de avaliação profissional na tabela seller_items
-- para permitir auto-preenchimento completo da Avaliação IA a partir do anúncio.

ALTER TABLE public.seller_items
  -- Padrão e estado
  ADD COLUMN IF NOT EXISTS acabamento text,            -- 'Simples'|'Médio'|'Bom'|'Alto padrão'|'Luxo'
  ADD COLUMN IF NOT EXISTS conservacao text,           -- 'Novo'|'Reformado'|'Bom estado'|'Antigo'|'Precisa reforma'
  ADD COLUMN IF NOT EXISTS liquidez text,              -- 'alta'|'media'|'baixa'

  -- Estrutura interna detalhada
  ADD COLUMN IF NOT EXISTS lavabos integer,
  ADD COLUMN IF NOT EXISTS kitchens integer,
  ADD COLUMN IF NOT EXISTS offices integer,
  ADD COLUMN IF NOT EXISTS total_floors_building integer,
  ADD COLUMN IF NOT EXISTS area_coberta_externa numeric,
  ADD COLUMN IF NOT EXISTS area_util numeric,

  -- Ambientes (booleans)
  ADD COLUMN IF NOT EXISTS amb_sala_estar boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS amb_sala_jantar boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS amb_sala_tv boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS amb_copa boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS amb_lavanderia boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS amb_area_servico boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS amb_closet boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS amb_despensa boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS amb_varanda_interna boolean DEFAULT false,

  -- Localização avançada
  ADD COLUMN IF NOT EXISTS loc_bairro_valorizado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS loc_rua_tranquila boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS loc_vista_privilegiada boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS loc_area_risco boolean DEFAULT false,

  -- Infraestrutura próxima
  ADD COLUMN IF NOT EXISTS infra_escola boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS infra_hospital boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS infra_comercio boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS infra_transporte boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS infra_parque boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS infra_bancos boolean DEFAULT false,

  -- Acabamento item-a-item
  ADD COLUMN IF NOT EXISTS finish_piso text,           -- 'simples'|'bom'|'premium'
  ADD COLUMN IF NOT EXISTS finish_banheiro text,       -- 'antigo'|'bom'|'moderno'
  ADD COLUMN IF NOT EXISTS finish_cozinha text,        -- 'antiga'|'boa'|'moderna'
  ADD COLUMN IF NOT EXISTS finish_pintura text,        -- 'ruim'|'media'|'nova'
  ADD COLUMN IF NOT EXISTS finish_esquadrias text,     -- 'antigas'|'boas'|'premium'
  ADD COLUMN IF NOT EXISTS finish_telhado text,        -- 'ruim'|'ok'|'novo'
  ADD COLUMN IF NOT EXISTS finish_eletrica text,       -- 'antiga'|'revisada'|'nova'

  -- Documentação avançada
  ADD COLUMN IF NOT EXISTS habite_se boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sem_pendencias_judiciais boolean DEFAULT false;