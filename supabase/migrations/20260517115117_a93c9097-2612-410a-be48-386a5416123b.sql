CREATE POLICY "Recruiters can view all candidate profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_type = 'candidate'
  AND public.is_recruiter(auth.uid())
);