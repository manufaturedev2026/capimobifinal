
CREATE TABLE public.generated_contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  template_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  variables jsonb DEFAULT '{}'::jsonb,
  signature_locador text,
  signature_locatario text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contracts" ON public.generated_contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contracts" ON public.generated_contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contracts" ON public.generated_contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contracts" ON public.generated_contracts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_generated_contracts_updated_at
  BEFORE UPDATE ON public.generated_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
