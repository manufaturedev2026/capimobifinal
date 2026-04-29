-- Garante unicidade do tool_key para o seed funcionar com ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS ai_tool_costs_tool_key_unique ON public.ai_tool_costs (tool_key);

-- Seed das ferramentas de IA (idempotente: roda em qualquer remix)
INSERT INTO public.ai_tool_costs 
  (tool_key, label, cost, category, description, is_session_based, session_window_minutes)
VALUES
  -- Geração de texto
  ('capture_ad_copy', 'Copywriter de Anúncio (IA)', 2, 'texto', 'Gera descrição persuasiva para o imóvel', false, 0),
  ('gallery_ai_headline', 'Manchete da Galeria (IA)', 1, 'texto', 'Gera título cinematográfico para o showroom', false, 0),
  ('contract_generation', 'Gerador de Contrato (IA)', 3, 'texto', 'Gera minuta de contrato personalizada', false, 0),
  ('valuation_ad', 'Anúncio de Avaliação (IA)', 2, 'texto', 'Gera anúncio para serviço de avaliação', false, 0),
  
  -- Análise de imagens (mais caro: usa modelos de visão)
  ('photo_analysis', 'Análise de Fotos do Imóvel (IA)', 5, 'visao', 'Analisa qualidade e sugere melhorias nas fotos', false, 0),
  ('property_valuation', 'Avaliação de Imóvel (IA)', 5, 'visao', 'Avaliação completa com análise visual e de mercado', false, 0),
  
  -- Bots conversacionais (cobrado por sessão de 30 min)
  ('capture_bot_chat', 'Bot de Captação (Chat)', 1, 'bot', 'Conversa com lead via bot de captação', true, 30),
  ('agenda_bot_chat', 'Bot de Agendamento (Chat)', 1, 'bot', 'Conversa com cliente para agendar visita', true, 30),
  ('invite_chat', 'Chat de Convite (IA)', 1, 'bot', 'Atendimento via página de convite', true, 30),
  ('platform_help_chat', 'Ajuda da Plataforma (IA)', 1, 'bot', 'Suporte interno via chat IA', true, 30),
  
  -- Operações sem custo (apenas registro de transação)
  ('credit_purchase', 'Compra de Créditos Avulsos', 0, 'sistema', 'Registro de compra de créditos extras', false, 0),
  ('founder_lot_grant', 'Concessão de Lote Fundador', 0, 'sistema', 'Registro de créditos concedidos pelo plano Fundador', false, 0)
ON CONFLICT (tool_key) DO NOTHING;