
-- Allow admins to view all job applications
CREATE POLICY "Admins can view all job applications"
ON public.job_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all jobs
CREATE POLICY "Admins can view all jobs"
ON public.jobs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all interviews
CREATE POLICY "Admins can view all interviews"
ON public.interviews
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all institution verifications (already exists but adding for completeness)
-- Allow admins to view all recruiter messages
CREATE POLICY "Admins can view all recruiter messages"
ON public.recruiter_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
