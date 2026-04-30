UPDATE public.subscription_plans
SET max_items = 250,
    max_photos_per_listing = 25,
    storage_mb = 2000,
    monthly_visits_limit = 500000,
    ai_credits_per_month = 2500,
    benefits = '["Até 250 imóveis ativos","Até 25 fotos por imóvel","2 GB de armazenamento","Até 500.000 visitas/mês","2.500 créditos de IA por mês","Até 20 corretores na equipe","Selo Start","Suporte por e-mail"]'::jsonb
WHERE tier = 'const_start';

UPDATE public.subscription_plans
SET max_items = 800,
    max_photos_per_listing = 35,
    storage_mb = 8000,
    monthly_visits_limit = 1500000,
    ai_credits_per_month = 6000,
    benefits = '["Até 800 imóveis ativos","Até 35 fotos por imóvel","8 GB de armazenamento","Até 1.500.000 visitas/mês","6.000 créditos de IA por mês","Até 100 corretores na equipe","Selo Pro","Suporte prioritário"]'::jsonb
WHERE tier = 'const_pro';

UPDATE public.subscription_plans
SET max_items = 15000,
    max_photos_per_listing = 50,
    storage_mb = 30000,
    monthly_visits_limit = 5000000,
    ai_credits_per_month = 15000,
    benefits = '["Até 15.000 imóveis ativos","Até 50 fotos por imóvel","30 GB de armazenamento","Até 5.000.000 visitas/mês","15.000 créditos de IA por mês","Equipe de corretores ilimitada","Topo da vitrine na sua cidade","Selo Master exclusivo","Suporte prioritário dedicado"]'::jsonb
WHERE tier = 'const_master';

CREATE OR REPLACE FUNCTION public.get_ai_monthly_credits_for_tier(p_tier text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE COALESCE(p_tier, 'basico')
    WHEN 'basico' THEN 25
    WHEN 'start' THEN 250
    WHEN 'premium' THEN 600
    WHEN 'prime' THEN 1500
    WHEN 'vip' THEN 1000
    WHEN 'imob_basico' THEN 25
    WHEN 'imob_start' THEN 1500
    WHEN 'imob_pro' THEN 3000
    WHEN 'imob_elite' THEN 6000
    WHEN 'const_basico' THEN 25
    WHEN 'const_start' THEN 2500
    WHEN 'const_pro' THEN 6000
    WHEN 'const_master' THEN 15000
    WHEN 'essencial_empresa' THEN 2000
    WHEN 'premium_empresa' THEN 2000
    WHEN 'prime_empresa' THEN 3500
    WHEN 'fundador_corretor' THEN 750
    WHEN 'fundador_empresa' THEN 3000
    WHEN 'fundador_construtora' THEN 5000
    ELSE 25
  END
$function$;