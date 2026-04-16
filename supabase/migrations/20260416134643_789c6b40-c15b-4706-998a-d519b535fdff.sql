
-- Auto-cancel partnerships when item is sold
CREATE OR REPLACE FUNCTION public.auto_cancel_partnerships_on_item_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When item status changes to 'vendido' or 'inativo', cancel pending and finalize approved partnerships
  IF NEW.status IN ('vendido', 'inativo') AND OLD.status = 'ativo' THEN
    UPDATE public.property_partnerships
    SET status = 'cancelado', updated_at = now()
    WHERE item_id = NEW.id AND status = 'pendente';

    UPDATE public.property_partnerships
    SET status = 'finalizado', updated_at = now()
    WHERE item_id = NEW.id AND status = 'aprovado';
  END IF;

  -- When partnership is disabled, cancel pending requests
  IF NEW.partnership_enabled = false AND OLD.partnership_enabled = true THEN
    UPDATE public.property_partnerships
    SET status = 'cancelado', updated_at = now()
    WHERE item_id = NEW.id AND status = 'pendente';

    UPDATE public.property_partnerships
    SET status = 'finalizado', updated_at = now()
    WHERE item_id = NEW.id AND status = 'aprovado';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_cancel_partnerships_on_item_change
  AFTER UPDATE ON public.seller_items
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_cancel_partnerships_on_item_change();

-- Auto-cancel partnerships when item is deleted
CREATE OR REPLACE FUNCTION public.auto_cancel_partnerships_on_item_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.property_partnerships
  SET status = 'cancelado', updated_at = now()
  WHERE item_id = OLD.id AND status IN ('pendente', 'aprovado');

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_auto_cancel_partnerships_on_item_delete
  BEFORE DELETE ON public.seller_items
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_cancel_partnerships_on_item_delete();
