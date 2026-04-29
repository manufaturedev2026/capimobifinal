DROP TRIGGER IF EXISTS trg_auto_story_on_new_item ON public.seller_items;
CREATE TRIGGER trg_auto_story_on_new_item
AFTER INSERT ON public.seller_items
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_story_on_new_item();