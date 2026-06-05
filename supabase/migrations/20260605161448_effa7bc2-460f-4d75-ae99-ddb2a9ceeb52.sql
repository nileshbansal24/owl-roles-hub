
-- 1. Table
CREATE TABLE public.job_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  recruiter_id uuid NOT NULL,
  added_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, recruiter_id)
);

CREATE INDEX idx_job_collaborators_job ON public.job_collaborators(job_id);
CREATE INDEX idx_job_collaborators_recruiter ON public.job_collaborators(recruiter_id);

GRANT SELECT, INSERT, DELETE ON public.job_collaborators TO authenticated;
GRANT ALL ON public.job_collaborators TO service_role;

ALTER TABLE public.job_collaborators ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions (SECURITY DEFINER, avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_job_collaborator(_job_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.job_collaborators
    WHERE job_id = _job_id AND recruiter_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_job_owner(_job_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.jobs WHERE id = _job_id AND created_by = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.get_user_university(_user_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT lower(trim(university)) FROM public.profiles WHERE id = _user_id
$$;

-- 3. Same-institution validation trigger
CREATE OR REPLACE FUNCTION public.validate_job_collaborator_institution()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  owner_id uuid;
  owner_univ text;
  collab_univ text;
BEGIN
  SELECT created_by INTO owner_id FROM public.jobs WHERE id = NEW.job_id;
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF NEW.recruiter_id = owner_id THEN
    RAISE EXCEPTION 'Job owner cannot be added as a collaborator';
  END IF;

  owner_univ := public.get_user_university(owner_id);
  collab_univ := public.get_user_university(NEW.recruiter_id);

  IF owner_univ IS NULL OR collab_univ IS NULL OR owner_univ = '' OR collab_univ = '' THEN
    RAISE EXCEPTION 'Both recruiters must have an institution on their profile';
  END IF;

  IF owner_univ <> collab_univ THEN
    RAISE EXCEPTION 'Collaborator must belong to the same institution';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_job_collaborator_institution
BEFORE INSERT ON public.job_collaborators
FOR EACH ROW EXECUTE FUNCTION public.validate_job_collaborator_institution();

-- 4. RLS policies on job_collaborators
CREATE POLICY "Owner or collaborator can view rows"
ON public.job_collaborators FOR SELECT TO authenticated
USING (
  auth.uid() = recruiter_id
  OR auth.uid() = added_by
  OR public.is_job_owner(job_id, auth.uid())
);

CREATE POLICY "Job owner can add collaborators"
ON public.job_collaborators FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = added_by
  AND public.is_job_owner(job_id, auth.uid())
);

CREATE POLICY "Owner can remove or collaborator can leave"
ON public.job_collaborators FOR DELETE TO authenticated
USING (
  public.is_job_owner(job_id, auth.uid())
  OR auth.uid() = recruiter_id
);

CREATE POLICY "Admins manage all collaborators"
ON public.job_collaborators FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Extend access on jobs, job_applications, interviews to collaborators
CREATE POLICY "Collaborators can view shared jobs"
ON public.jobs FOR SELECT
USING (public.is_job_collaborator(id, auth.uid()));

CREATE POLICY "Collaborators can update shared jobs"
ON public.jobs FOR UPDATE
USING (public.is_job_collaborator(id, auth.uid()));

CREATE POLICY "Collaborators can view applications for shared jobs"
ON public.job_applications FOR SELECT TO authenticated
USING (public.is_job_collaborator(job_id, auth.uid()));

CREATE POLICY "Collaborators can update applications for shared jobs"
ON public.job_applications FOR UPDATE TO authenticated
USING (public.is_job_collaborator(job_id, auth.uid()));

CREATE POLICY "Collaborators can view interviews for shared jobs"
ON public.interviews FOR SELECT
USING (public.is_job_collaborator(job_id, auth.uid()));

CREATE POLICY "Collaborators can create interviews for shared jobs"
ON public.interviews FOR INSERT
WITH CHECK (
  auth.uid() = recruiter_id
  AND public.is_job_collaborator(job_id, auth.uid())
);

CREATE POLICY "Collaborators can update interviews for shared jobs"
ON public.interviews FOR UPDATE
USING (public.is_job_collaborator(job_id, auth.uid()));

-- 6. Allow recruiters to discover same-institution colleagues for the picker
CREATE POLICY "Recruiters can view same-institution recruiters"
ON public.profiles FOR SELECT TO authenticated
USING (
  user_type = 'recruiter'
  AND public.is_recruiter(auth.uid())
  AND university IS NOT NULL
  AND lower(trim(university)) = public.get_user_university(auth.uid())
);
