INSERT INTO public.subscription_plans (
  tier, name, price, category, color, max_items, is_active, is_popular, sort_order, benefits
)
SELECT
  'fundador_corretor',
  'Fundador',
  97,
  'individual',
  'from-amber-500 to-orange-600',
  max_items,
  false,
  false,
  99,
  to_jsonb(ARRAY[
    'Tudo do plano VIP por 1 ano',
    'Pagamento único (oferta limitada)',
    '500 créditos IA (não renováveis)',
    'Selo exclusivo de Membro Fundador',
    'Acesso vitalício à comunidade Fundadores',
    'Apenas 500 vagas por lote'
  ])
FROM public.subscription_plans
WHERE tier = 'vip'
LIMIT 1
ON CONFLICT (tier) DO NOTHING;

INSERT INTO public.subscription_plans (
  tier, name, price, category, color, max_items, is_active, is_popular, sort_order, benefits
)
SELECT
  'fundador_empresa',
  'Fundador Empresa',
  97,
  'enterprise',
  'from-yellow-600 to-amber-700',
  max_items,
  false,
  false,
  99,
  to_jsonb(ARRAY[
    'Tudo do plano Black Empresa por 1 ano',
    'Pagamento único (oferta limitada)',
    '1.750 créditos IA (não renováveis)',
    'Até 30 parceiros vinculados',
    'Selo exclusivo de Imobiliária Fundadora',
    'Apenas 500 vagas por lote'
  ])
FROM public.subscription_plans
WHERE tier = 'prime_empresa'
LIMIT 1
ON CONFLICT (tier) DO NOTHING;