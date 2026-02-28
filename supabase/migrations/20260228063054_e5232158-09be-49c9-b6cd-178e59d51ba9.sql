
CREATE OR REPLACE FUNCTION public.sync_candidate_directory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only sync candidates, not recruiters or admins
  IF NEW.user_type = 'candidate' AND NOT public.has_role(NEW.id, 'admin') THEN
    INSERT INTO public.candidate_directory (
      id, full_name, email, avatar_url, university, role, bio, location, headline,
      skills, professional_summary, user_type, years_experience, current_salary,
      expected_salary, updated_at
    ) VALUES (
      NEW.id, NEW.full_name, NEW.email, NEW.avatar_url, NEW.university, NEW.role,
      NEW.bio, NEW.location, NEW.headline, NEW.skills, NEW.professional_summary,
      NEW.user_type, NEW.years_experience, NEW.current_salary, NEW.expected_salary,
      NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name, email = EXCLUDED.email,
      avatar_url = EXCLUDED.avatar_url, university = EXCLUDED.university,
      role = EXCLUDED.role, bio = EXCLUDED.bio, location = EXCLUDED.location,
      headline = EXCLUDED.headline, skills = EXCLUDED.skills,
      professional_summary = EXCLUDED.professional_summary,
      user_type = EXCLUDED.user_type, years_experience = EXCLUDED.years_experience,
      current_salary = EXCLUDED.current_salary, expected_salary = EXCLUDED.expected_salary,
      updated_at = EXCLUDED.updated_at;
  ELSE
    -- Remove from directory if they're not a candidate or are an admin
    DELETE FROM public.candidate_directory WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
