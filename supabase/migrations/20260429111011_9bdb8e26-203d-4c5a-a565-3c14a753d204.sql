-- Garante unicidade do tier para o seed funcionar com ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS subscription_plans_tier_unique ON public.subscription_plans (tier);

-- Seed dos 10 planos (idempotente: roda em qualquer remix)
INSERT INTO public.subscription_plans 
  (name, tier, price, max_items, ai_generations_per_day, benefits, color, border_color, badge_color, is_active, is_popular, sort_order, category)
VALUES
  ('Básico', 'basico', 0.00, 3, 25,
    '["Até 3 imóveis ativos","25 créditos de IA por mês","Vitrine padrão (Showcase)","Catálogo público responsivo","Compartilhamento WhatsApp","Suporte por e-mail"]'::jsonb,
    '#64748B', '#64748B', '#64748B', true, false, 0, 'corretor'),
  ('Start', 'start', 49.90, 15, 250,
    '["Até 15 imóveis ativos","250 créditos de IA por mês","Vitrine personalizada","Catálogo público responsivo","CRM de leads incluído","Compartilhamento WhatsApp","Suporte por e-mail"]'::jsonb,
    '#3B82F6', '#3B82F6', '#3B82F6', true, false, 1, 'corretor'),
  ('Premium', 'premium', 99.90, 50, 600,
    '["Até 50 imóveis ativos","600 créditos de IA por mês","Todos os layouts de loja (Netflix, Showcase, etc)","Destaque na vitrine global","Marca d''água personalizada","Stories de imóveis","Simulador de financiamento","Tags coloridas em destaque","CRM completo + automações","Suporte prioritário WhatsApp"]'::jsonb,
    '#A855F7', '#A855F7', '#A855F7', true, true, 2, 'corretor'),
  ('VIP', 'vip', 199.90, 999999, 1000,
    '["Imóveis ilimitados","1.000 créditos de IA por mês","Selo VIP exclusivo (badge animado)","Topo absoluto da vitrine global","Páginas de imóvel cinematográficas","Domínio personalizado","Equipe ilimitada de corretores","Vídeos no hero da loja","Bot de captação com IA","Gerente de conta dedicado","Suporte 24/7 prioridade máxima"]'::jsonb,
    '#FACC15', '#FACC15', '#FACC15', true, false, 3, 'corretor'),
  ('Imob Start', 'imob_start', 199.90, 100, 1500,
    '["Até 100 imóveis ativos","Até 5 corretores na equipe","1.500 créditos de IA por mês","Lojas espelho para cada corretor","CRM completo com kanban","Todos os layouts de loja","Marca d''água personalizada","Stories de imóveis","Suporte WhatsApp"]'::jsonb,
    '#0EA5E9', '#0EA5E9', '#0EA5E9', true, false, 10, 'imobiliaria'),
  ('Imob Pro', 'imob_pro', 399.90, 300, 3000,
    '["Até 300 imóveis ativos","Até 15 corretores na equipe","3.000 créditos de IA por mês","Página SEO para cada corretor","Bot de captação com IA","Bot de agendamento","Domínio personalizado","Selo de imobiliária verificada","Tags coloridas em destaque","CRM avançado + automações","Gerente de conta dedicado","Suporte prioritário"]'::jsonb,
    '#A855F7', '#A855F7', '#A855F7', true, true, 11, 'imobiliaria'),
  ('Imob Elite', 'imob_elite', 799.90, 999999, 6000,
    '["Imóveis ilimitados","Corretores ilimitados","6.000 créditos de IA por mês","Selo Elite exclusivo","Topo absoluto da vitrine","Páginas cinematográficas","Múltiplos domínios","Vídeos no hero da loja","Análise de leads por IA","Consultor estratégico exclusivo","Suporte 24/7 prioridade máxima"]'::jsonb,
    '#FACC15', '#FACC15', '#FACC15', true, false, 12, 'imobiliaria'),
  ('Construtora Start', 'const_start', 299.90, 150, 2000,
    '["Até 150 unidades cadastradas","Até 10 vendedores na equipe","2.000 créditos de IA por mês","Páginas de empreendimento","Plantas e tabela de preços","Bot de captação para lançamentos","CRM com pipeline de vendas","Suporte WhatsApp"]'::jsonb,
    '#0EA5E9', '#0EA5E9', '#0EA5E9', true, false, 20, 'construtora'),
  ('Construtora Pro', 'const_pro', 599.90, 500, 4500,
    '["Até 500 unidades cadastradas","Até 30 vendedores na equipe","4.500 créditos de IA por mês","Múltiplos empreendimentos em destaque","Páginas cinematográficas por imóvel","Tour virtual integrado","Bot de captação + agendamento","Domínio personalizado","Selo Construtora Verificada","Gerente de conta dedicado","Suporte prioritário"]'::jsonb,
    '#A855F7', '#A855F7', '#A855F7', true, true, 21, 'construtora'),
  ('Construtora Master', 'const_master', 1299.90, 999999, 10000,
    '["Unidades ilimitadas","Vendedores ilimitados","10.000 créditos de IA por mês","Topo absoluto em todas as vitrines","Múltiplos domínios e subdomínios","Vídeos institucionais no hero","Análise de leads por IA","Integração com portais externos","Consultor estratégico exclusivo","Onboarding personalizado","SLA garantido + suporte 24/7"]'::jsonb,
    '#FACC15', '#FACC15', '#FACC15', true, false, 22, 'construtora')
ON CONFLICT (tier) DO NOTHING;