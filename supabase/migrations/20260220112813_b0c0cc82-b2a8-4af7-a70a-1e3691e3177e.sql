
-- Add salary fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_salary integer NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expected_salary integer NULL;

-- Add salary fields to candidate_directory
ALTER TABLE public.candidate_directory ADD COLUMN IF NOT EXISTS current_salary integer NULL;
ALTER TABLE public.candidate_directory ADD COLUMN IF NOT EXISTS expected_salary integer NULL;

-- Update the sync trigger to include salary fields
CREATE OR REPLACE FUNCTION public.sync_candidate_directory_from_profiles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  calculated_exp integer;
BEGIN
  IF NEW.user_type = 'candidate' THEN
    IF (NEW.years_experience IS NULL OR NEW.years_experience = 0) AND NEW.experience IS NOT NULL THEN
      calculated_exp := calculate_years_experience(NEW.experience);
    ELSE
      calculated_exp := COALESCE(NEW.years_experience, 0);
    END IF;

    INSERT INTO candidate_directory (
      id, full_name, avatar_url, university, role, bio, location, headline,
      skills, professional_summary, user_type, years_experience, email,
      current_salary, expected_salary, updated_at
    ) VALUES (
      NEW.id, NEW.full_name, NEW.avatar_url, NEW.university, NEW.role, NEW.bio,
      NEW.location, NEW.headline, NEW.skills, NEW.professional_summary,
      NEW.user_type, calculated_exp, NEW.email,
      NEW.current_salary, NEW.expected_salary, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url,
      university = EXCLUDED.university, role = EXCLUDED.role, bio = EXCLUDED.bio,
      location = EXCLUDED.location, headline = EXCLUDED.headline,
      skills = EXCLUDED.skills, professional_summary = EXCLUDED.professional_summary,
      user_type = EXCLUDED.user_type, years_experience = EXCLUDED.years_experience,
      email = EXCLUDED.email, current_salary = EXCLUDED.current_salary,
      expected_salary = EXCLUDED.expected_salary, updated_at = NOW();
  ELSIF TG_OP = 'UPDATE' AND OLD.user_type = 'candidate' AND NEW.user_type != 'candidate' THEN
    DELETE FROM candidate_directory WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;
