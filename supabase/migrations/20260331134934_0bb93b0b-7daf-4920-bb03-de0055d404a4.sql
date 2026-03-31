
ALTER TABLE public.seller_stories
  ADD COLUMN title text,
  ADD COLUMN description text,
  ADD COLUMN button_text text,
  ADD COLUMN button_url text,
  ADD COLUMN item_id uuid;
