-- Allow recruiters to view any candidate profile (they already have access to candidate_directory)
CREATE POLICY "Recruiters can view candidate profiles"
ON public.profiles
FOR SELECT
USING (
  is_recruiter(auth.uid()) AND user_type = 'candidate'
);