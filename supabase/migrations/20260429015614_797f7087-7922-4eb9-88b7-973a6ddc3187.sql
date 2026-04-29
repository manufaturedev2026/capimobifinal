-- Tabela para custos dinâmicos das ferramentas IA
CREATE TABLE IF NOT EXISTS public.ai_tool_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_key text NOT NULL UNIQUE,
  label text NOT NULL,
  cost integer NOT NULL DEFAULT 1 CHECK (cost >= 0),
  description text,
  category text NOT NULL DEFAULT 'geral',
  is_session_based boolean NOT NULL DEFAULT false,
  session_window_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_tool_costs ENABLE ROW LEVEL SECURITY;

-- Leitura pública (edge functions e UI precisam ler)
CREATE POLICY "Anyone can read ai tool costs"
ON public.ai_tool_costs FOR SELECT USING (true);

-- Apenas admins podem modificar
CREATE POLICY "Admins can insert ai tool costs"
ON public.ai_tool_costs FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ai tool costs"
ON public.ai_tool_costs FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ai tool costs"
ON public.ai_tool_costs FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_ai_tool_costs_updated_at
BEFORE UPDATE ON public.ai_tool_costs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed com os custos atuais
INSERT INTO public.ai_tool_costs (tool_key, label, cost, description, category, is_session_based, session_window_minutes) VALUES
  ('capture_ad_copy', 'Gerador de Copy/Anúncio', 2, 'Gera descrição e título estruturado do imóvel', 'conteudo', false, 30),
  ('property_valuation', 'Avaliação de Imóvel', 5, 'Avalia preço de mercado do imóvel', 'analise', false, 30),
  ('valuation_ad', 'Anúncio de Avaliação', 2, 'Gera anúncio a partir da avaliação', 'conteudo', false, 30),
  ('photo_analysis', 'Análise de Fotos', 3, 'Analisa fotos do imóvel com IA', 'analise', false, 30),
  ('platform_help_chat', 'Chat Ajuda da Plataforma', 1, 'Suporte interno via IA', 'suporte', false, 30),
  ('capture_bot_chat', 'Bot Captação WhatsApp', 3, 'Atendimento via bot de captação (por janela)', 'bots', true, 30),
  ('agenda_bot_chat', 'Bot Agenda', 3, 'Atendimento via bot de agendamento (por janela)', 'bots', true, 30),
  ('invite_chat', 'Bot Convite', 3, 'Atendimento via bot de convite (por janela)', 'bots', true, 30)
ON CONFLICT (tool_key) DO NOTHING;