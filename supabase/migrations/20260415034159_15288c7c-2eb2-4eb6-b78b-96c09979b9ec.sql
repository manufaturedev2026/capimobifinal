
-- Add is_auto flag to seller_stories
ALTER TABLE public.seller_stories ADD COLUMN IF NOT EXISTS is_auto boolean NOT NULL DEFAULT false;

-- Create function to auto-generate story when new item is inserted
CREATE OR REPLACE FUNCTION public.auto_create_story_on_new_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier text;
  v_max_auto_stories int;
  v_current_auto_count int;
  v_first_photo text;
  v_seller_name text;
BEGIN
  -- Only for active items with photos
  IF NEW.status != 'ativo' OR NEW.photos IS NULL OR array_length(NEW.photos, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get seller subscription tier
  SELECT s.tier INTO v_tier
  FROM public.seller_subscriptions s
  WHERE s.seller_id = NEW.seller_id
    AND s.is_active = true
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Determine max auto stories by tier
  v_max_auto_stories := CASE v_tier
    WHEN 'premium' THEN 2       -- VIP
    WHEN 'vip' THEN 4           -- Premium
    WHEN 'essencial_empresa' THEN 8  -- Exclusive
    WHEN 'premium_empresa' THEN 10   -- Prime
    WHEN 'prime_empresa' THEN 20     -- Black
    WHEN 'black' THEN 20            -- Black
    ELSE 0
  END;

  -- Not eligible
  IF v_max_auto_stories = 0 THEN
    RETURN NEW;
  END IF;

  -- Count current active auto stories
  SELECT count(*) INTO v_current_auto_count
  FROM public.seller_stories
  WHERE seller_id = NEW.seller_id
    AND is_auto = true
    AND is_active = true
    AND expires_at > now();

  -- Already at limit
  IF v_current_auto_count >= v_max_auto_stories THEN
    RETURN NEW;
  END IF;

  -- Get first photo
  v_first_photo := NEW.photos[1];

  -- Insert auto story
  INSERT INTO public.seller_stories (
    seller_id, user_id, image_url, title, description,
    button_text, button_url, item_id, is_auto, expires_at
  ) VALUES (
    NEW.seller_id,
    NEW.user_id,
    v_first_photo,
    NEW.title,
    CASE WHEN NEW.price IS NOT NULL
      THEN 'R$ ' || to_char(NEW.price, 'FM999G999G999D00')
      ELSE NULL
    END,
    'Ver Imóvel',
    '/imovel/' || COALESCE(NEW.slug, NEW.id::text),
    NEW.id,
    true,
    now() + interval '24 hours'
  );

  RETURN NEW;
END;
$$;

-- Create trigger on seller_items
CREATE TRIGGER trg_auto_story_on_new_item
  AFTER INSERT ON public.seller_items
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_story_on_new_item();
