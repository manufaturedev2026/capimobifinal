
DROP POLICY IF EXISTS "System can insert commissions" ON public.commissions;
CREATE POLICY "Admins can insert commissions" ON public.commissions
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
