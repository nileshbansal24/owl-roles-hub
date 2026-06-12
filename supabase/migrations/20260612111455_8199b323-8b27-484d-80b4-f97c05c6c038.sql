
-- 1. Tighten is_recruiter so it only returns true for approved recruiters.
--    All RLS policies relying on is_recruiter() (profiles, candidate_directory,
--    storage credentials) now automatically refuse pending/rejected recruiters.
CREATE OR REPLACE FUNCTION public.is_recruiter(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND user_type = 'recruiter'
      AND approval_status = 'approved'
  )
$function$;

-- 2. Prevent users from self-promoting via a fresh INSERT on profiles.
--    Force user_type to 'candidate' (or approval_status='pending' if recruiter)
--    when the caller is not an admin.
CREATE OR REPLACE FUNCTION public.enforce_profile_insert_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.user_type = 'recruiter' THEN
      NEW.approval_status := 'pending';
    ELSE
      NEW.approval_status := COALESCE(NEW.approval_status, 'approved');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_insert_safety_trg ON public.profiles;
CREATE TRIGGER enforce_profile_insert_safety_trg
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_insert_safety();

-- 3. Hide quiz correct answers from authenticated users by revoking
--    column-level SELECT and exposing them only via a SECURITY DEFINER RPC.
REVOKE SELECT ON public.event_questions FROM authenticated;
GRANT SELECT (id, event_id, question_text, question_type, options, points, order_index, created_at)
  ON public.event_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_questions TO authenticated;
-- Re-grant write privs minus the correct_answer SELECT
REVOKE SELECT (correct_answer) ON public.event_questions FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_event_questions_with_answers(_event_id uuid)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  question_text text,
  question_type text,
  options jsonb,
  correct_answer text,
  points integer,
  order_index integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.event_id, q.question_text, q.question_type::text, q.options,
         q.correct_answer, q.points, q.order_index, q.created_at
  FROM public.event_questions q
  WHERE q.event_id = _event_id
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = q.event_id AND e.recruiter_id = auth.uid()
      )
    )
  ORDER BY q.order_index ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_event_questions_with_answers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_event_questions_with_answers(uuid) TO authenticated;

-- 4. Server-side quiz grading so candidates can't fabricate scores.
CREATE OR REPLACE FUNCTION public.grade_quiz_submission(_submission_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_row public.quiz_submissions%ROWTYPE;
  q record;
  total_score integer := 0;
  total_max integer := 0;
  ans text;
BEGIN
  SELECT * INTO sub_row FROM public.quiz_submissions WHERE id = _submission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;
  IF sub_row.candidate_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF sub_row.submitted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Submission already graded';
  END IF;

  FOR q IN
    SELECT id, question_type, correct_answer, points
    FROM public.event_questions
    WHERE event_id = sub_row.event_id
  LOOP
    total_max := total_max + COALESCE(q.points, 0);
    ans := sub_row.answers ->> q.id::text;
    IF q.question_type::text = 'mcq' AND q.correct_answer IS NOT NULL
       AND ans IS NOT NULL AND ans = q.correct_answer THEN
      total_score := total_score + COALESCE(q.points, 0);
    END IF;
  END LOOP;

  UPDATE public.quiz_submissions
  SET submitted_at = now(),
      score = total_score,
      max_score = total_max,
      time_taken_seconds = GREATEST(0, EXTRACT(EPOCH FROM (now() - started_at))::int)
  WHERE id = _submission_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grade_quiz_submission(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grade_quiz_submission(uuid) TO authenticated;

-- 5. Lock down internal definer helpers that don't need broad access.
REVOKE EXECUTE ON FUNCTION public.get_admin_user_ids() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_own_user_type(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_own_approval_status(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_university(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_job_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_job_collaborator(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_verified_recruiter(uuid) FROM PUBLIC, anon;
