-- Add personal details fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS family_details text,
ADD COLUMN IF NOT EXISTS hobbies text[],
ADD COLUMN IF NOT EXISTS quotes text,
ADD COLUMN IF NOT EXISTS recommended_books text[];