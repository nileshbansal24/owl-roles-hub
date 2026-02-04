-- Fix the experience calculation to handle overlapping dates and cap at reasonable values
-- Also recalculate for profiles with unrealistic values

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
  max_reasonable_years integer := 50; -- Cap at 50 years
BEGIN
  IF experience_json IS NULL OR jsonb_array_length(experience_json) = 0 THEN
    RETURN 0;
  END IF;

  FOR exp_item IN SELECT * FROM jsonb_array_elements(experience_json)
  LOOP
    -- Reset for each iteration
    start_date := NULL;
    end_date := NULL;
    
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
        IF start_text ~ '^\d{4}$' THEN
          start_date := (start_text || '-01-01')::date;
        ELSIF start_text ~ '^\d{1,2}/\d{4}$' THEN
          start_date := to_date(start_text, 'MM/YYYY');
        ELSIF start_text ~ '^[A-Za-z]+\s+\d{4}$' THEN
          start_date := to_date(start_text, 'Month YYYY');
        ELSIF start_text ~ '^[A-Za-z]+,?\s*\d{4}$' THEN
          start_date := to_date(regexp_replace(start_text, ',', '', 'g'), 'Month YYYY');
        ELSE
          start_date := start_text::date;
        END IF;
      EXCEPTION WHEN OTHERS THEN
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
        ELSIF end_text ~ '^[A-Za-z]+\s+\d{4}$' THEN
          end_date := to_date(end_text, 'Month YYYY');
        ELSIF end_text ~ '^[A-Za-z]+,?\s*\d{4}$' THEN
          end_date := to_date(regexp_replace(end_text, ',', '', 'g'), 'Month YYYY');
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
  END LOOP;

  -- Return years, capped at reasonable maximum
  RETURN LEAST(GREATEST(0, ROUND(total_months / 12.0)::integer), max_reasonable_years);
END;
$$;

-- Recalculate all experience values
UPDATE profiles p
SET years_experience = calculate_years_experience(p.experience)
WHERE p.experience IS NOT NULL
  AND jsonb_array_length(p.experience) > 0;

-- Re-sync to candidate_directory
UPDATE candidate_directory cd
SET years_experience = p.years_experience
FROM profiles p
WHERE cd.id = p.id
  AND p.user_type = 'candidate';