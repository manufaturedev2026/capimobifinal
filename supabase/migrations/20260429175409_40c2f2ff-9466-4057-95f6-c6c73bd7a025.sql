CREATE OR REPLACE FUNCTION public.increment_item_views(_item_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.seller_items
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = _item_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_item_views(uuid) TO anon, authenticated;