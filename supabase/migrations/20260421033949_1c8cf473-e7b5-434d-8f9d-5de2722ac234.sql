
-- Tabela de planos editáveis pelo admin
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL UNIQUE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  setup_fee numeric NOT NULL DEFAULT 0,
  max_items integer NOT NULL DEFAULT 5,
  ai_generations_per_day integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT 'from-slate-500 to-slate-600',
  border_color text NOT NULL DEFAULT 'border-slate-400',
  badge_color text NOT NULL DEFAULT 'bg-slate-500 text-white',
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text NOT NULL DEFAULT 'individual', -- 'individual' | 'enterprise' | 'free'
  is_active boolean NOT NULL DEFAULT true,
  is_popular boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage plans"
  ON public.subscription_plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial com os 8 planos atuais
INSERT INTO public.subscription_plans (tier, name, price, setup_fee, max_items, ai_generations_per_day, color, border_color, badge_color, benefits, category, is_active, is_popular, sort_order) VALUES
('basico', 'Básico', 0, 0, 5, 5, 'from-slate-500 to-slate-600', 'border-slate-400', 'bg-slate-500 text-white',
 '["Até 5 anúncios ativos","Vitrine própria (sua loja online)","URL personalizada /seu-nome","1 Layout (Marketplace) + 1 Tema","Painel do vendedor completo","Estatísticas básicas","Gerador de contratos (1 modelo)","QR Code dos anúncios e propostas PDF","Calculadora de Lucro (ROI)","Sistema de Parcerias entre corretores","Push: 1 envio por dia","Gerador de Texto IA: 5/dia"]'::jsonb,
 'free', true, false, 0),
('start', 'Start', 24.99, 299, 25, 10, 'from-emerald-500 to-teal-600', 'border-emerald-400', 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
 '["Até 25 anúncios ativos","Vitrine Lvl 1 — mais visibilidade","1 Layout (Showcase) + 3 Temas","CRM Kanban completo","Stories (estilo Instagram)","Página de Captação de imóveis","Todos os modelos de contrato","Simulador de Financiamento","PDF de Proposta profissional","Selo Start + Hero Banner","Destaque na listagem","Push: 1 envio por dia","Gerador de Texto IA: 10/dia"]'::jsonb,
 'individual', true, false, 1),
('premium', 'VIP', 59.99, 719, 60, 20, 'from-amber-500 to-orange-600', 'border-amber-400', 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
 '["Até 60 anúncios ativos","Vitrine Lvl 2 — destaque superior","4 Layouts + 6 Temas","Tudo do Start +","Bot de Captação (fluxo fixo)","Push Notifications: 2 envios por dia","Vídeo banner hero (autoplay)","Modo Cinema imersivo","Efeitos visuais na loja","Gestão de Aluguéis completa","Sistema de ADS integrado","Estatísticas avançadas","Selo VIP nos anúncios","Suporte prioritário","Gerador de Texto IA: 20/dia"]'::jsonb,
 'individual', true, true, 2),
('vip', 'Premium', 114.99, 1379, 115, 50, 'from-purple-600 to-indigo-700', 'border-purple-500', 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
 '["Até 115 anúncios ativos","Vitrine Lvl 3 — máximo individual","Todos os 7 Layouts + Temas","Tudo do VIP +","Captação com IA Inteligente","Instagram na loja","SEO otimizado (cidade/bairro)","Destaque Épico (até 5 imóveis)","Galeria Showroom + Copywriting","Selo Premium exclusivo","Push Notifications: 3 envios por dia","Suporte VIP dedicado","Gerador de Texto IA: 50/dia"]'::jsonb,
 'individual', true, false, 3),
('essencial_empresa', 'Exclusive', 199.99, 0, 9999, 100, 'from-rose-600 to-red-700', 'border-rose-500', 'bg-gradient-to-r from-rose-600 to-red-600 text-white',
 '["Anúncios ilimitados","Vitrine Lvl 4 — prioridade empresa","Todos os layouts + temas","Tudo do Premium +","Até 5 corretores vinculados","Lojas espelho por corretor","WhatsApp Team Picker","Analytics por corretor","Selo Exclusive","Push Notifications: 4 envios por dia","Suporte dedicado","Gerador de Texto IA: 100/dia"]'::jsonb,
 'enterprise', true, false, 4),
('premium_empresa', 'Prime', 349.99, 0, 9999, 200, 'from-sky-600 to-blue-700', 'border-sky-500', 'bg-gradient-to-r from-sky-600 to-blue-700 text-white',
 '["Anúncios ilimitados","Vitrine Lvl 5 — destaque premium","Tudo do Exclusive +","Até 10 corretores vinculados","Domínio personalizado","Selo Prime","Push Notifications: 5 envios por dia","Suporte premium dedicado","Gerador de Texto IA: 200/dia"]'::jsonb,
 'enterprise', true, false, 5),
('prime_empresa', 'Black Empresa', 599.99, 0, 9999, 400, 'from-zinc-800 to-zinc-950', 'border-zinc-500', 'bg-gradient-to-r from-zinc-800 to-zinc-950 text-white',
 '["Anúncios ilimitados","Vitrine Lvl 6 — máximo absoluto","Tudo do Prime +","Corretores ilimitados","Gerente de conta VIP dedicado","Selo Black ★ exclusivo","Push Notifications: 6 envios por dia","Suporte 24/7 prioritário","Gerador de Texto IA: 400/dia"]'::jsonb,
 'enterprise', true, false, 6),
('black', 'Black', 899.99, 0, 9999, 400, 'from-zinc-900 to-black', 'border-yellow-500', 'bg-gradient-to-r from-zinc-900 to-black text-yellow-400 border border-yellow-500/50',
 '["Anúncios ilimitados","Vitrine Lvl 6 — máximo absoluto","Tudo do Prime +","Corretores ilimitados","Gerente de conta VIP dedicado","Selo Black ★ exclusivo","Push Notifications: 6 envios por dia","Suporte 24/7 prioritário","Gerador de Texto IA: 400/dia"]'::jsonb,
 'enterprise', true, false, 7);
