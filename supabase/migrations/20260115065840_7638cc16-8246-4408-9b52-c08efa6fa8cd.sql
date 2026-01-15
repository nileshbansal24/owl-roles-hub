-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Recruiters can view candidate profiles" ON public.profiles;

-- Create policy: Users can only view their own full profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a public view for candidate browsing that excludes sensitive data (phone)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id,
  full_name,
  avatar_url,
  university,
  role,
  bio,
  years_experience,
  location,
  headline,
  skills,
  user_type,
  created_at,
  updated_at
  -- phone and resume_url are excluded for privacy
FROM public.profiles
WHERE user_type = 'candidate';

-- Grant access to the view for authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Create RLS policy for the view (recruiters can see public candidate profiles)
-- Note: Views inherit RLS from base table, so we need a policy that allows recruiters to see candidates
CREATE POLICY "Recruiters can view candidate public profiles"
ON public.profiles
FOR SELECT
USING (
  user_type = 'candidate' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type = 'recruiter'
  )
);