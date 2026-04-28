-- Remove tier 'black' from credit function
CREATE OR REPLACE FUNCTION public.get_ai_monthly_credits_for_tier(p_tier text)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE COALESCE(p_tier, 'basico')
    WHEN 'basico' THEN 50
    WHEN 'start' THEN 500
    WHEN 'premium' THEN 1200
    WHEN 'vip' THEN 2000
    WHEN 'essencial_empresa' THEN 4000
    WHEN 'premium_empresa' THEN 4000
    WHEN 'prime_empresa' THEN 7000
    ELSE 50
  END
$function$;

-- Remove auto story tier black mapping
CREATE OR REPLACE FUNCTION public.auto_create_story_on_new_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tier text;
  v_max_auto_stories int;
  v_current_auto_count int;
  v_first_photo text;
BEGIN
  IF NEW.status != 'ativo' OR NEW.photos IS NULL OR array_length(NEW.photos, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT s.tier INTO v_tier
  FROM public.seller_subscriptions s
  WHERE s.seller_id = NEW.seller_id AND s.is_active = true
  ORDER BY s.created_at DESC LIMIT 1;

  v_max_auto_stories := CASE v_tier
    WHEN 'premium' THEN 2
    WHEN 'vip' THEN 4
    WHEN 'essencial_empresa' THEN 8
    WHEN 'premium_empresa' THEN 10
    WHEN 'prime_empresa' THEN 20
    ELSE 0
  END;

  IF v_max_auto_stories = 0 THEN RETURN NEW; END IF;

  SELECT count(*) INTO v_current_auto_count
  FROM public.seller_stories
  WHERE seller_id = NEW.seller_id AND is_auto = true AND is_active = true AND expires_at > now();

  IF v_current_auto_count >= v_max_auto_stories THEN RETURN NEW; END IF;

  v_first_photo := NEW.photos[1];

  INSERT INTO public.seller_stories (
    seller_id, user_id, image_url, title, description,
    button_text, button_url, item_id, is_auto, expires_at
  ) VALUES (
    NEW.seller_id, NEW.user_id, v_first_photo, NEW.title,
    CASE WHEN NEW.price IS NOT NULL THEN 'R$ ' || to_char(NEW.price, 'FM999G999G999D00') ELSE NULL END,
    'Ver Imóvel', '/imovel/' || COALESCE(NEW.slug, NEW.id::text),
    NEW.id, true, now() + interval '24 hours'
  );

  RETURN NEW;
END;
$function$;

-- Delete the Black plan from subscription_plans
DELETE FROM public.subscription_plans WHERE tier = 'black';