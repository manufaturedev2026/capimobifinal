-- Add new tag enum values
ALTER TYPE public.item_tag ADD VALUE IF NOT EXISTS 'alto_padrao';
ALTER TYPE public.item_tag ADD VALUE IF NOT EXISTS 'oportunidade';
ALTER TYPE public.item_tag ADD VALUE IF NOT EXISTS 'ultimas_unidades';
ALTER TYPE public.item_tag ADD VALUE IF NOT EXISTS 'area_lazer';
ALTER TYPE public.item_tag ADD VALUE IF NOT EXISTS 'piscina_tag';
ALTER TYPE public.item_tag ADD VALUE IF NOT EXISTS 'aceita_financiamento_tag';