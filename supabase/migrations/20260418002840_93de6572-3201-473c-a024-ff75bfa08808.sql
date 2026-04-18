-- Seed idempotente: garante dados básicos em qualquer remix novo

INSERT INTO public.crm_funnel_stages (name, color, sort_order) VALUES
  ('Novo', '#3b82f6', 0),
  ('Contato Feito', '#f59e0b', 1),
  ('Interessado', '#8b5cf6', 2),
  ('Negociando', '#f97316', 3),
  ('Fechado', '#22c55e', 4),
  ('Perdido', '#ef4444', 5)
ON CONFLICT DO NOTHING;

INSERT INTO public.platform_settings (key, value) VALUES
  ('homepage_mode', 'marketplace'),
  ('site_name', 'Capimobi'),
  ('site_tagline', 'Plataforma imobiliária profissional'),
  ('contact_email', 'contato@capimobi.com.br')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.account_managers (name, email, phone, is_active)
SELECT 'Equipe Capimobi', 'contato@capimobi.com.br', '', true
WHERE NOT EXISTS (SELECT 1 FROM public.account_managers LIMIT 1);