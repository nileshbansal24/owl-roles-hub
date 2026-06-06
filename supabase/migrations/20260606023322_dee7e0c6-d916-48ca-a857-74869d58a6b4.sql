
CREATE OR REPLACE FUNCTION public.get_admin_user_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_user_ids() TO authenticated, anon;

DELETE FROM public.candidate_directory
WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');
