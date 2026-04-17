-- 1. Trigger: quando um gerente for atualizado (nome/telefone/foto), sincronizar nos profiles vinculados
CREATE OR REPLACE FUNCTION public.sync_account_manager_to_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se nome, telefone ou foto mudaram, atualiza todos os profiles que referenciam esse gerente pelo nome ANTIGO
  IF (OLD.name IS DISTINCT FROM NEW.name)
     OR (OLD.phone IS DISTINCT FROM NEW.phone)
     OR (OLD.photo_url IS DISTINCT FROM NEW.photo_url) THEN
    UPDATE public.profiles
    SET account_manager = NEW.name,
        manager_phone = NEW.phone,
        manager_photo = NEW.photo_url,
        updated_at = now()
    WHERE account_manager = OLD.name;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_account_manager_update ON public.account_managers;
CREATE TRIGGER trg_sync_account_manager_update
AFTER UPDATE ON public.account_managers
FOR EACH ROW
EXECUTE FUNCTION public.sync_account_manager_to_profiles();

-- 2. Trigger: quando um gerente for excluído OU desativado, reatribuir clientes ao próximo gerente ativo
CREATE OR REPLACE FUNCTION public.reassign_clients_on_manager_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_name text;
  v_fallback_name text;
  v_fallback_phone text;
  v_fallback_photo text;
  v_should_reassign boolean := false;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old_name := OLD.name;
    v_should_reassign := true;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Apenas se foi DESATIVADO (de ativo para inativo)
    IF OLD.is_active = true AND NEW.is_active = false THEN
      v_old_name := OLD.name;
      v_should_reassign := true;
    END IF;
  END IF;

  IF v_should_reassign THEN
    -- Pega o próximo gerente ativo (ordem alfabética, excluindo o que está saindo)
    SELECT name, phone, photo_url
    INTO v_fallback_name, v_fallback_phone, v_fallback_photo
    FROM public.account_managers
    WHERE is_active = true
      AND name <> v_old_name
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_fallback_name IS NOT NULL THEN
      UPDATE public.profiles
      SET account_manager = v_fallback_name,
          manager_phone = v_fallback_phone,
          manager_photo = v_fallback_photo,
          updated_at = now()
      WHERE account_manager = v_old_name;
    ELSE
      -- Sem gerente disponível, limpa
      UPDATE public.profiles
      SET account_manager = NULL,
          manager_phone = NULL,
          manager_photo = NULL,
          updated_at = now()
      WHERE account_manager = v_old_name;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_reassign_clients_on_manager_delete ON public.account_managers;
CREATE TRIGGER trg_reassign_clients_on_manager_delete
BEFORE DELETE ON public.account_managers
FOR EACH ROW
EXECUTE FUNCTION public.reassign_clients_on_manager_removal();

DROP TRIGGER IF EXISTS trg_reassign_clients_on_manager_deactivate ON public.account_managers;
CREATE TRIGGER trg_reassign_clients_on_manager_deactivate
AFTER UPDATE OF is_active ON public.account_managers
FOR EACH ROW
EXECUTE FUNCTION public.reassign_clients_on_manager_removal();