
CREATE TABLE public.agenda_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  user_id UUID NOT NULL,
  item_id UUID REFERENCES public.seller_items(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Bot de Agendamento',
  attendant_name TEXT NOT NULL DEFAULT 'Assistente de Agendamento',
  attendant_avatar TEXT,
  opening_message TEXT,
  success_cta_label TEXT NOT NULL DEFAULT '💬 Falar no WhatsApp',
  success_cta_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seller_id, slug)
);

CREATE INDEX idx_agenda_bots_seller ON public.agenda_bots(seller_id);
CREATE INDEX idx_agenda_bots_slug ON public.agenda_bots(slug);

ALTER TABLE public.agenda_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bots" ON public.agenda_bots
  FOR SELECT USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Owners can insert bots" ON public.agenda_bots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update bots" ON public.agenda_bots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete bots" ON public.agenda_bots
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all bots" ON public.agenda_bots
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_agenda_bots_updated_at BEFORE UPDATE ON public.agenda_bots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
