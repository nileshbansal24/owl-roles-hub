-- Add extended profile fields for full candidate information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS experience jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS research_papers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS achievements text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS subjects text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS teaching_philosophy text DEFAULT '',
ADD COLUMN IF NOT EXISTS professional_summary text DEFAULT '';

-- Update the profiles_public view to include new fields
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
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
  updated_at,
  experience,
  education,
  research_papers,
  achievements,
  subjects,
  teaching_philosophy
FROM public.profiles;