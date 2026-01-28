-- Allow authenticated users to view verification status for any recruiter
-- This is needed to show verification badges on job listings
CREATE POLICY "Authenticated users can view all verification statuses"
ON public.institution_verifications
FOR SELECT
TO authenticated
USING (true);