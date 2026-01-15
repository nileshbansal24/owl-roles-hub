-- FIX 1: Remove the recruiter policy that exposes phone numbers on base table
DROP POLICY IF EXISTS "Recruiters can view candidate public profiles" ON public.profiles;

-- The profiles table should only be accessible by the user themselves
-- Recruiters will use the profiles_public view which excludes phone

-- FIX 2: Create a public view for jobs that excludes created_by
CREATE OR REPLACE VIEW public.jobs_public
WITH (security_invoker=on) AS
SELECT 
  id,
  title,
  institute,
  location,
  description,
  salary_range,
  job_type,
  tags,
  created_at
  -- created_by is excluded for privacy
FROM public.jobs;

-- Grant access to the jobs view
GRANT SELECT ON public.jobs_public TO anon, authenticated;

-- FIX 3: Ensure profiles_public view is only accessible to authenticated recruiters
-- First revoke public access
REVOKE SELECT ON public.profiles_public FROM anon;

-- Create a security definer function to check if user is a recruiter
CREATE OR REPLACE FUNCTION public.is_recruiter(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
    AND user_type = 'recruiter'
  )
$$;