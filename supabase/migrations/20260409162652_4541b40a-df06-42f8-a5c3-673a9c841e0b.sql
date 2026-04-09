
CREATE TABLE public.partnership_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL,
  agency_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_profile_id, agency_profile_id)
);

ALTER TABLE public.partnership_requests ENABLE ROW LEVEL SECURITY;

-- Corretores podem criar solicitações próprias
CREATE POLICY "Requesters can insert own requests"
ON public.partnership_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_user_id);

-- Corretores podem ver suas solicitações
CREATE POLICY "Requesters can view own requests"
ON public.partnership_requests
FOR SELECT
TO authenticated
USING (auth.uid() = requester_user_id);

-- Imobiliárias podem ver solicitações recebidas
CREATE POLICY "Agencies can view received requests"
ON public.partnership_requests
FOR SELECT
TO authenticated
USING (auth.uid() = agency_user_id);

-- Imobiliárias podem atualizar solicitações recebidas
CREATE POLICY "Agencies can update received requests"
ON public.partnership_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = agency_user_id);

-- Admins podem tudo
CREATE POLICY "Admins can manage all requests"
ON public.partnership_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_partnership_requests_updated_at
BEFORE UPDATE ON public.partnership_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
