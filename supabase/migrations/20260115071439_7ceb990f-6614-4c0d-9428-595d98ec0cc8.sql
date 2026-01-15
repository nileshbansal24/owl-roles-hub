
-- Allow recruiters to view profiles of applicants who applied to their jobs
CREATE POLICY "Recruiters can view applicant profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.job_applications ja
    JOIN public.jobs j ON ja.job_id = j.id
    WHERE ja.applicant_id = profiles.id
    AND j.created_by = auth.uid()
  )
);
