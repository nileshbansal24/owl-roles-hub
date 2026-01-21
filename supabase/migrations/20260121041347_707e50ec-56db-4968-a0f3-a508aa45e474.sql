-- Add ORCID ID and Scopus link fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS orcid_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS scopus_link text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS linkedin_url text DEFAULT NULL;