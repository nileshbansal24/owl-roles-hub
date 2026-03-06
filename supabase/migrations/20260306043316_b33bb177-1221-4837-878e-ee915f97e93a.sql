
-- Drop the existing recruiter insert policy and recreate it to allow uploaded_by to be the recruiter
DROP POLICY IF EXISTS "Recruiters can insert verifications" ON public.credential_verifications;

CREATE POLICY "Recruiters can insert verifications"
  ON public.credential_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = recruiter_id AND is_recruiter(auth.uid()) AND auth.uid() = uploaded_by);
