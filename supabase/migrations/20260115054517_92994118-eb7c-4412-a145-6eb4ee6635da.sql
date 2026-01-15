-- Fix profiles SELECT policy to properly require authentication
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- For jobs table, the public visibility is intentional for a job board
-- But we should hide the created_by field - we'll handle this at the application level
-- Jobs should remain publicly viewable for job seekers