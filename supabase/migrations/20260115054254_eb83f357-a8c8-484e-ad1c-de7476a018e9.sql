-- Remove the redundant public access policy (keeping only the authenticated one)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;