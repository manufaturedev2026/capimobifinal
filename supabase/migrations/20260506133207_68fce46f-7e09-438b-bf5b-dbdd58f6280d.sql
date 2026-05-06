UPDATE public.subscription_plans
SET monthly_visits_limit = 9999,
    benefits = '["Até 150 imóveis ativos","Até 20 fotos por imóvel","1,5 GB de armazenamento","Visitas ilimitadas","3.000 créditos de IA por mês","Corretores ilimitados (lojas espelho)","Topo da vitrine na sua cidade","Selo Elite exclusivo","Suporte prioritário"]'::jsonb
WHERE tier = 'imob_elite';