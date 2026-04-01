
CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  funnel_stage TEXT NOT NULL DEFAULT 'novo',
  notes TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage CRM contacts" ON public.crm_contacts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.crm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stage TEXT NOT NULL,
  message TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read CRM templates" ON public.crm_templates
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage CRM templates" ON public.crm_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.crm_funnel_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_funnel_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read funnel stages" ON public.crm_funnel_stages
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage funnel stages" ON public.crm_funnel_stages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Default funnel stages
INSERT INTO public.crm_funnel_stages (name, color, sort_order) VALUES
  ('Novo', '#3b82f6', 0),
  ('Contactado', '#f59e0b', 1),
  ('Apresentação', '#8b5cf6', 2),
  ('Negociação', '#f97316', 3),
  ('Fechado', '#22c55e', 4),
  ('Perdido', '#ef4444', 5);

-- Default templates
INSERT INTO public.crm_templates (name, stage, message, sort_order) VALUES
  ('Boas-vindas', 'novo', 'Olá {nome}! 👋 Seja bem-vindo(a) ao ES Corretores! Sou da equipe e estou aqui para te ajudar a aproveitar ao máximo a plataforma. Posso te apresentar nossos planos?', 0),
  ('Apresentação de Planos', 'contactado', 'Olá {nome}! Temos planos incríveis para você: desde o Start (R$ 24,99/mês) com 10 anúncios até o Premium (R$ 114,99/mês) com 50 anúncios e Google Ads. Quer saber mais sobre algum?', 1),
  ('Follow-up', 'apresentação', 'Oi {nome}! Tudo bem? Estou passando para saber se você teve alguma dúvida sobre os planos que te apresentei. Lembre-se que temos 7 dias grátis para testar! 🚀', 2),
  ('Fechamento', 'negociação', 'Olá {nome}! Vi que você está interessado(a) em anunciar conosco. Posso te ajudar a ativar seu plano agora mesmo? Temos condições especiais este mês! 💰', 3),
  ('Pós-venda', 'fechado', 'Parabéns {nome}! 🎉 Seu plano foi ativado com sucesso! Qualquer dúvida sobre como cadastrar seus anúncios ou usar a plataforma, estou à disposição!', 4);
