
CREATE POLICY "Requesters can delete own requests"
ON public.partnership_requests
FOR DELETE
TO authenticated
USING (auth.uid() = requester_user_id);
