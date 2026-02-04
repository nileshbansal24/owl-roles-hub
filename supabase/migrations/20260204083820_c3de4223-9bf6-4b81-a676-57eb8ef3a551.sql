
-- Create a function to calculate total years of experience from experience JSON
CREATE OR REPLACE FUNCTION public.calculate_years_experience(experience_json jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exp_item jsonb;
  total_months integer := 0;
  start_date date;
  end_date date;
  start_text text;
  end_text text;
  months_diff integer;
BEGIN
  IF experience_json IS NULL OR jsonb_array_length(experience_json) = 0 THEN
    RETURN 0;
  END IF;

  FOR exp_item IN SELECT * FROM jsonb_array_elements(experience_json)
  LOOP
    -- Get start date
    start_text := COALESCE(
      exp_item->>'start_date',
      exp_item->>'startDate',
      exp_item->>'year'
    );
    
    -- Get end date (or use current date if current job)
    IF (exp_item->>'current')::boolean = true THEN
      end_date := CURRENT_DATE;
    ELSE
      end_text := COALESCE(
        exp_item->>'end_date',
        exp_item->>'endDate'
      );
    END IF;

    -- Parse start date
    IF start_text IS NOT NULL AND start_text != '' THEN
      BEGIN
        -- Try to parse various formats
        IF start_text ~ '^\d{4}$' THEN
          -- Year only format: "2020"
          start_date := (start_text || '-01-01')::date;
        ELSIF start_text ~ '^\d{1,2}/\d{4}$' THEN
          -- MM/YYYY format
          start_date := to_date(start_text, 'MM/YYYY');
        ELSIF start_text ~ '^[A-Za-z]+,?\s*\d{4}$' THEN
          -- "January 2020" or "Jan, 2020" format
          start_date := to_date(regexp_replace(start_text, ',', '', 'g'), 'Month YYYY');
        ELSIF start_text ~ '^[A-Za-z]+\s+\d{4}$' THEN
          -- "June 2022" format
          start_date := to_date(start_text, 'Month YYYY');
        ELSE
          -- Try ISO format or other
          start_date := start_text::date;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Skip this entry if parsing fails
        CONTINUE;
      END;
    ELSE
      CONTINUE;
    END IF;

    -- Parse end date if not already set
    IF end_date IS NULL AND end_text IS NOT NULL AND end_text != '' AND lower(end_text) NOT IN ('present', 'current') THEN
      BEGIN
        IF end_text ~ '^\d{4}$' THEN
          end_date := (end_text || '-12-31')::date;
        ELSIF end_text ~ '^\d{1,2}/\d{4}$' THEN
          end_date := to_date(end_text, 'MM/YYYY');
        ELSIF end_text ~ '^[A-Za-z]+,?\s*\d{4}$' THEN
          end_date := to_date(regexp_replace(end_text, ',', '', 'g'), 'Month YYYY');
        ELSIF end_text ~ '^[A-Za-z]+\s+\d{4}$' THEN
          end_date := to_date(end_text, 'Month YYYY');
        ELSE
          end_date := end_text::date;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        end_date := CURRENT_DATE;
      END;
    ELSIF end_date IS NULL THEN
      end_date := CURRENT_DATE;
    END IF;

    -- Calculate months difference
    IF start_date IS NOT NULL AND end_date IS NOT NULL AND end_date >= start_date THEN
      months_diff := (EXTRACT(YEAR FROM end_date) - EXTRACT(YEAR FROM start_date)) * 12 +
                     (EXTRACT(MONTH FROM end_date) - EXTRACT(MONTH FROM start_date));
      total_months := total_months + GREATEST(0, months_diff);
    END IF;

    -- Reset end_date for next iteration
    end_date := NULL;
  END LOOP;

  -- Return years (rounded)
  RETURN GREATEST(0, ROUND(total_months / 12.0)::integer);
END;
$$;

-- Update the sync trigger to calculate years_experience from experience JSON
CREATE OR REPLACE FUNCTION public.sync_candidate_directory_from_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_exp integer;
BEGIN
  -- Only sync if user_type is 'candidate'
  IF NEW.user_type = 'candidate' THEN
    -- Calculate years of experience from experience JSON if not set or is 0
    IF (NEW.years_experience IS NULL OR NEW.years_experience = 0) AND NEW.experience IS NOT NULL THEN
      calculated_exp := calculate_years_experience(NEW.experience);
    ELSE
      calculated_exp := COALESCE(NEW.years_experience, 0);
    END IF;

    INSERT INTO candidate_directory (
      id,
      full_name,
      avatar_url,
      university,
      role,
      bio,
      location,
      headline,
      skills,
      professional_summary,
      user_type,
      years_experience,
      email,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.full_name,
      NEW.avatar_url,
      NEW.university,
      NEW.role,
      NEW.bio,
      NEW.location,
      NEW.headline,
      NEW.skills,
      NEW.professional_summary,
      NEW.user_type,
      calculated_exp,
      NEW.email,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      university = EXCLUDED.university,
      role = EXCLUDED.role,
      bio = EXCLUDED.bio,
      location = EXCLUDED.location,
      headline = EXCLUDED.headline,
      skills = EXCLUDED.skills,
      professional_summary = EXCLUDED.professional_summary,
      user_type = EXCLUDED.user_type,
      years_experience = EXCLUDED.years_experience,
      email = EXCLUDED.email,
      updated_at = NOW();
  ELSIF TG_OP = 'UPDATE' AND OLD.user_type = 'candidate' AND NEW.user_type != 'candidate' THEN
    -- Remove from directory if user_type changed from candidate
    DELETE FROM candidate_directory WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also update existing profiles years_experience based on their experience JSON
UPDATE profiles p
SET years_experience = calculate_years_experience(p.experience)
WHERE (p.years_experience IS NULL OR p.years_experience = 0)
  AND p.experience IS NOT NULL
  AND jsonb_array_length(p.experience) > 0;

-- Re-sync all candidates to candidate_directory with calculated experience
INSERT INTO candidate_directory (
  id, full_name, avatar_url, university, role, bio, location, headline, 
  skills, professional_summary, user_type, years_experience, email, updated_at
)
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.university,
  p.role,
  p.bio,
  p.location,
  p.headline,
  p.skills,
  p.professional_summary,
  p.user_type,
  CASE 
    WHEN (p.years_experience IS NULL OR p.years_experience = 0) AND p.experience IS NOT NULL 
    THEN calculate_years_experience(p.experience)
    ELSE COALESCE(p.years_experience, 0)
  END,
  p.email,
  NOW()
FROM profiles p
WHERE p.user_type = 'candidate'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  university = EXCLUDED.university,
  role = EXCLUDED.role,
  bio = EXCLUDED.bio,
  location = EXCLUDED.location,
  headline = EXCLUDED.headline,
  skills = EXCLUDED.skills,
  professional_summary = EXCLUDED.professional_summary,
  user_type = EXCLUDED.user_type,
  years_experience = EXCLUDED.years_experience,
  email = EXCLUDED.email,
  updated_at = NOW();
