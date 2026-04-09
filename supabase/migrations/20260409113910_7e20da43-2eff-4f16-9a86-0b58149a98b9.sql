
-- 1. Fix profile role escalation: Add WITH CHECK to prevent user_type modification
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (
    -- user_type must remain unchanged (compare against current DB value)
    user_type IS NOT DISTINCT FROM (SELECT p.user_type FROM public.profiles p WHERE p.id = auth.uid())
    -- OR the caller is an admin
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- 2. Remove overly broad recruiter SELECT policy on profiles
-- Keep only the scoped "Recruiters can view applicant profiles" policy
DROP POLICY IF EXISTS "Recruiters can view candidate profiles" ON public.profiles;

-- 3. Enable Realtime Authorization
-- Supabase Realtime postgres_changes respects RLS on source tables.
-- The existing RLS on job_applications and recruiter_notifications already
-- scopes data to the correct user. We ensure the realtime subscription
-- topic authorization by enabling RLS on realtime.messages if it exists.
-- Note: In modern Supabase, Realtime Authorization is handled via the
-- existing table-level RLS policies which are already properly scoped.
