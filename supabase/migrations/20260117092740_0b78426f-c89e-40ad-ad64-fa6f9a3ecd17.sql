-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Drop and recreate profiles_public view to include email
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
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
  professional_summary,
  updated_at,
  email
FROM public.profiles
WHERE user_type = 'candidate' OR user_type IS NULL;