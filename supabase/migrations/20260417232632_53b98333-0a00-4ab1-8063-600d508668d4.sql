CREATE TABLE public.account_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.account_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active managers"
ON public.account_managers FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage managers"
ON public.account_managers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_account_managers_updated_at
BEFORE UPDATE ON public.account_managers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();