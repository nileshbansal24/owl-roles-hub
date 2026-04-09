
-- Add approval_status and designation columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS designation text;

-- Update existing recruiters to approved
UPDATE public.profiles SET approval_status = 'approved' WHERE user_type = 'recruiter';

-- Update handle_new_user to set pending for recruiters
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, user_type, university, designation, approval_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url',
    COALESCE(new.raw_user_meta_data ->> 'user_type', 'candidate'),
    new.raw_user_meta_data ->> 'institution_name',
    new.raw_user_meta_data ->> 'designation',
    CASE 
      WHEN COALESCE(new.raw_user_meta_data ->> 'user_type', 'candidate') = 'recruiter' THEN 'pending'
      ELSE 'approved'
    END
  );
  RETURN new;
END;
$$;

-- Update the profile UPDATE policy to also allow approval_status changes only by admins
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (
    user_type IS NOT DISTINCT FROM (SELECT p.user_type FROM public.profiles p WHERE p.id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  AND (
    approval_status IS NOT DISTINCT FROM (SELECT p.approval_status FROM public.profiles p WHERE p.id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Allow admins to update any profile (for approval)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
