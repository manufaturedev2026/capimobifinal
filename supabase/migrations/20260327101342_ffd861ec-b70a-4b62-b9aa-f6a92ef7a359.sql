
-- Add 'vendido' to item_status enum
ALTER TYPE public.item_status ADD VALUE IF NOT EXISTS 'vendido';

-- Add sold_at column to seller_items
ALTER TABLE public.seller_items ADD COLUMN IF NOT EXISTS sold_at timestamp with time zone DEFAULT NULL;
