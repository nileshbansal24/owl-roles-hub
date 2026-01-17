-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;

-- Create new policy: only authenticated users can view all job details
CREATE POLICY "Authenticated users can view jobs" 
ON public.jobs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);