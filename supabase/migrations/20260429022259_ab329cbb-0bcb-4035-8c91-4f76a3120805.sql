-- 1) Atualizar max_items e benefits dos planos individuais
UPDATE public.subscription_plans
SET max_items = 30,
    benefits = jsonb_build_array(
      'Até 30 anúncios ativos',
      'Vitrine própria personalizável',
      'Layouts e temas básicos',
      'CRM Kanban completo',
      'Estatísticas básicas',
      'Sistema de Parcerias entre corretores',
      'Push: 1 envio por dia'
    ),
    updated_at = now()
WHERE tier = 'start';

UPDATE public.subscription_plans
SET max_items = 80,
    benefits = jsonb_build_array(
      'Até 80 anúncios ativos',
      'Todos os 7 Layouts + Temas',
      'WhatsApp Bot de Captação com IA',
      'CRM Kanban completo',
      'Stories (estilo Instagram)',
      'Modo Cinema imersivo',
      'Vídeo banner hero (autoplay)',
      'Galeria Showroom + Copywriting IA',
      'Gestão de Aluguéis completa',
      'Instagram na loja',
      'SEO otimizado (cidade/bairro)',
      'Destaque Épico (até 5 imóveis)',
      'Calculadora de Lucro (ROI)',
      'Sistema de Parcerias entre corretores',
      'Selo VIP',
      'Push Notifications: 3 envios por dia'
    ),
    updated_at = now()
WHERE tier = 'premium';

UPDATE public.subscription_plans
SET max_items = 200,
    benefits = jsonb_build_array(
      'Até 200 anúncios ativos',
      'Todos os 7 Layouts + Temas',
      'URL personalizada /seu-nome',
      'Painel completo do vendedor',
      'WhatsApp Bot de Captação com IA',
      'Página de Captação de imóveis',
      'CRM Kanban completo',
      'Stories (estilo Instagram)',
      'Analytics avançado',
      'Modo Cinema imersivo',
      'Vídeo banner hero (autoplay)',
      'Galeria Showroom + Copywriting IA',
      'Gestão de Aluguéis completa',
      'Instagram na loja',
      'SEO otimizado (cidade/bairro)',
      'Destaque Épico (até 5 imóveis)',
      'Hero Banner personalizado',
      'Todos os modelos de contrato',
      'Simulador de Financiamento',
      'PDF de Proposta profissional',
      'QR Code dos anúncios',
      'Calculadora de Lucro (ROI)',
      'Sistema de Parcerias entre corretores',
      'Domínio personalizado',
      'Selo Premium',
      'Push Notifications: 5 envios por dia',
      'Suporte premium dedicado'
    ),
    updated_at = now()
WHERE tier = 'vip';

-- 2) Atualizar planos empresa (limitar o "ilimitado" e ajustar corretores)
UPDATE public.subscription_plans
SET max_items = 300,
    benefits = jsonb_build_array(
      'Até 300 anúncios ativos',
      'Vitrine Lvl 1 — pareada com Start',
      'Todos os 7 Layouts + Temas',
      'Até 8 corretores vinculados',
      'Lojas espelho por corretor',
      'WhatsApp Team Picker',
      'CRM Kanban completo',
      'Analytics por corretor',
      'Bot de Captação com IA Inteligente',
      'Sistema de ADS integrado',
      'Vídeo banner hero (autoplay)',
      'Modo Cinema imersivo',
      'Efeitos visuais na loja',
      'Gestão de Aluguéis completa',
      'Instagram na loja',
      'SEO otimizado (cidade/bairro)',
      'Destaque Épico (até 5 imóveis)',
      'Galeria Showroom + Copywriting',
      'Gerador de contratos + propostas PDF',
      'Calculadora de Lucro (ROI)',
      'Sistema de Parcerias entre corretores',
      'Selo Exclusive',
      'Push Notifications: 4 envios por dia',
      'Suporte dedicado'
    ),
    updated_at = now()
WHERE tier = 'essencial_empresa';

UPDATE public.subscription_plans
SET max_items = 600,
    benefits = jsonb_build_array(
      'Até 600 anúncios ativos',
      'Vitrine Lvl 2 — pareada com VIP',
      'Todos os 7 Layouts + Temas',
      'URL personalizada /seu-nome',
      'Painel do vendedor completo',
      'Até 15 corretores vinculados',
      'Lojas espelho por corretor',
      'WhatsApp Team Picker',
      'CRM Kanban completo',
      'Stories (estilo Instagram)',
      'Analytics avançado por corretor',
      'Bot de Captação com IA Inteligente',
      'Página de Captação de imóveis',
      'Sistema de ADS integrado',
      'Vídeo banner hero (autoplay)',
      'Modo Cinema imersivo',
      'Efeitos visuais na loja',
      'Gestão de Aluguéis completa',
      'Instagram na loja',
      'SEO otimizado (cidade/bairro)',
      'Destaque Épico (até 5 imóveis)',
      'Galeria Showroom + Copywriting',
      'Hero Banner',
      'Todos os modelos de contrato',
      'Simulador de Financiamento',
      'PDF de Proposta profissional',
      'QR Code dos anúncios',
      'Calculadora de Lucro (ROI)',
      'Sistema de Parcerias entre corretores',
      'Estatísticas avançadas',
      'Domínio personalizado',
      'Selo Prime',
      'Push Notifications: 5 envios por dia',
      'Suporte premium dedicado'
    ),
    updated_at = now()
WHERE tier = 'premium_empresa';

UPDATE public.subscription_plans
SET max_items = 1500,
    benefits = jsonb_build_array(
      'Até 1.500 anúncios ativos',
      'Vitrine Lvl 3 — pareada com Premium',
      'Todos os 7 Layouts + Temas',
      'URL personalizada /seu-nome',
      'Painel do vendedor completo',
      'Até 25 corretores vinculados',
      'Lojas espelho por corretor',
      'WhatsApp Team Picker',
      'CRM Kanban completo',
      'Stories (estilo Instagram)',
      'Analytics avançado por corretor',
      'Bot de Captação com IA Inteligente',
      'Página de Captação de imóveis',
      'Sistema de ADS integrado',
      'Vídeo banner hero (autoplay)',
      'Modo Cinema imersivo',
      'Efeitos visuais na loja',
      'Gestão de Aluguéis completa',
      'Instagram na loja',
      'SEO otimizado (cidade/bairro)',
      'Destaque Épico (até 5 imóveis)',
      'Galeria Showroom + Copywriting',
      'Hero Banner',
      'Todos os modelos de contrato',
      'Simulador de Financiamento',
      'PDF de Proposta profissional',
      'QR Code dos anúncios',
      'Calculadora de Lucro (ROI)',
      'Sistema de Parcerias entre corretores',
      'Estatísticas avançadas',
      'Domínio personalizado',
      'Gerente de conta VIP dedicado',
      'Selo Black ★ exclusivo',
      'Push Notifications: 6 envios por dia',
      'Suporte 24/7 prioritário'
    ),
    updated_at = now()
WHERE tier = 'prime_empresa';

-- 3) Constraint anti-abuso: máximo de 10 fotos por imóvel (validação no banco)
ALTER TABLE public.seller_items
DROP CONSTRAINT IF EXISTS seller_items_max_photos_check;

ALTER TABLE public.seller_items
ADD CONSTRAINT seller_items_max_photos_check
CHECK (photos IS NULL OR array_length(photos, 1) IS NULL OR array_length(photos, 1) <= 10);