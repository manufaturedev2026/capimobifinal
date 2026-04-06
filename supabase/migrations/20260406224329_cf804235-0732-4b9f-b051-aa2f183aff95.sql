CREATE POLICY "Sellers can delete own notification logs"
ON public.push_notifications_log
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);