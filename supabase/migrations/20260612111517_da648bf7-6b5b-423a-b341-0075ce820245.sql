
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name, p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon, PUBLIC;',
                   fn.schema_name, fn.func_name, fn.args);
  END LOOP;
END $$;

-- Re-grant the helpers that RLS policies / app code rely on for signed-in users.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_recruiter(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_recruiter(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_user_type(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_approval_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_university(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_job_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_job_collaborator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_questions_with_answers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grade_quiz_submission(uuid) TO authenticated;
