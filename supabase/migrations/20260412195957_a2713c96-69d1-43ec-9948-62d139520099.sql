
-- Create security definer functions to check current values without recursion
CREATE OR REPLACE FUNCTION public.get_own_user_type(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_own_approval_status(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT approval_status FROM public.profiles WHERE id = _user_id
$$;

-- Drop and recreate the policy without self-referencing subqueries
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (
    user_type IS NOT DISTINCT FROM public.get_own_user_type(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  AND (
    approval_status IS NOT DISTINCT FROM public.get_own_approval_status(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);
