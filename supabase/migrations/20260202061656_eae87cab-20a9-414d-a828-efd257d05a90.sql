-- Candidate directory table: safe subset of candidate profiles for recruiter search
CREATE TABLE IF NOT EXISTS public.candidate_directory (
  id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  university text,
  role text,
  bio text,
  years_experience integer,
  location text,
  headline text,
  skills text[],
  professional_summary text,
  user_type text,
  updated_at timestamptz,
  email text
);

ALTER TABLE public.candidate_directory ENABLE ROW LEVEL SECURITY;

-- Only recruiters can browse the directory (keeps candidate data from being publicly readable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'candidate_directory'
      AND policyname = 'Recruiters can browse candidate directory'
  ) THEN
    CREATE POLICY "Recruiters can browse candidate directory"
    ON public.candidate_directory
    FOR SELECT
    USING (public.is_recruiter(auth.uid()));
  END IF;
END $$;

-- Optional: candidates can see their own directory row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'candidate_directory'
      AND policyname = 'Candidates can view their own directory row'
  ) THEN
    CREATE POLICY "Candidates can view their own directory row"
    ON public.candidate_directory
    FOR SELECT
    USING (auth.uid() = id);
  END IF;
END $$;

-- Backfill from existing profiles
INSERT INTO public.candidate_directory (
  id, full_name, avatar_url, university, role, bio, years_experience, location, headline,
  skills, professional_summary, user_type, updated_at, email
)
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  p.university,
  p.role,
  p.bio,
  p.years_experience,
  p.location,
  p.headline,
  p.skills,
  p.professional_summary,
  p.user_type,
  p.updated_at,
  p.email
FROM public.profiles p
WHERE p.user_type = 'candidate' OR p.user_type IS NULL
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  university = EXCLUDED.university,
  role = EXCLUDED.role,
  bio = EXCLUDED.bio,
  years_experience = EXCLUDED.years_experience,
  location = EXCLUDED.location,
  headline = EXCLUDED.headline,
  skills = EXCLUDED.skills,
  professional_summary = EXCLUDED.professional_summary,
  user_type = EXCLUDED.user_type,
  updated_at = EXCLUDED.updated_at,
  email = EXCLUDED.email;

-- Keep directory in sync with profiles
CREATE OR REPLACE FUNCTION public.sync_candidate_directory_from_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM public.candidate_directory WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  IF (NEW.user_type = 'candidate' OR NEW.user_type IS NULL) THEN
    INSERT INTO public.candidate_directory (
      id, full_name, avatar_url, university, role, bio, years_experience, location, headline,
      skills, professional_summary, user_type, updated_at, email
    ) VALUES (
      NEW.id,
      NEW.full_name,
      NEW.avatar_url,
      NEW.university,
      NEW.role,
      NEW.bio,
      NEW.years_experience,
      NEW.location,
      NEW.headline,
      NEW.skills,
      NEW.professional_summary,
      NEW.user_type,
      NEW.updated_at,
      NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      university = EXCLUDED.university,
      role = EXCLUDED.role,
      bio = EXCLUDED.bio,
      years_experience = EXCLUDED.years_experience,
      location = EXCLUDED.location,
      headline = EXCLUDED.headline,
      skills = EXCLUDED.skills,
      professional_summary = EXCLUDED.professional_summary,
      user_type = EXCLUDED.user_type,
      updated_at = EXCLUDED.updated_at,
      email = EXCLUDED.email;
  ELSE
    DELETE FROM public.candidate_directory WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_sync_candidate_directory'
  ) THEN
    CREATE TRIGGER trg_profiles_sync_candidate_directory
    AFTER INSERT OR UPDATE
    ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_candidate_directory_from_profiles();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_delete_candidate_directory'
  ) THEN
    CREATE TRIGGER trg_profiles_delete_candidate_directory
    AFTER DELETE
    ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_candidate_directory_from_profiles();
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_candidate_directory_updated_at ON public.candidate_directory (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_directory_role ON public.candidate_directory (role);
CREATE INDEX IF NOT EXISTS idx_candidate_directory_university ON public.candidate_directory (university);
CREATE INDEX IF NOT EXISTS idx_candidate_directory_location ON public.candidate_directory (location);
CREATE INDEX IF NOT EXISTS idx_candidate_directory_skills_gin ON public.candidate_directory USING GIN (skills);
