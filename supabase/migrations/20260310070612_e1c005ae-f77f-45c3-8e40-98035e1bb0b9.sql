
-- Fix calculate_years_experience to merge overlapping intervals
CREATE OR REPLACE FUNCTION public.calculate_years_experience(experience_json jsonb)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  exp_item jsonb;
  start_date date;
  end_date date;
  start_text text;
  end_text text;
  intervals date[][] := '{}';
  merged date[][] := '{}';
  i integer;
  current_start date;
  current_end date;
  total_months integer := 0;
  max_reasonable_years integer := 50;
BEGIN
  IF experience_json IS NULL OR jsonb_array_length(experience_json) = 0 THEN
    RETURN 0;
  END IF;

  -- Collect all intervals
  FOR exp_item IN SELECT * FROM jsonb_array_elements(experience_json)
  LOOP
    start_date := NULL;
    end_date := NULL;
    
    start_text := COALESCE(
      exp_item->>'start_date',
      exp_item->>'startDate',
      exp_item->>'year'
    );
    
    IF (exp_item->>'current')::boolean = true OR (exp_item->>'isCurrent')::boolean = true THEN
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

    -- Parse end date
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

    IF start_date IS NOT NULL AND end_date IS NOT NULL AND end_date >= start_date THEN
      intervals := intervals || ARRAY[ARRAY[start_date, end_date]];
    END IF;
  END LOOP;

  -- If no valid intervals, return 0
  IF array_length(intervals, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- Sort intervals by start date and merge overlapping ones
  -- Use a temp table approach via unnest and sort
  current_start := NULL;
  current_end := NULL;
  
  FOR i IN 1..array_length(intervals, 1)
  LOOP
    -- We need to process sorted; simple insertion sort approach
    NULL; -- placeholder
  END LOOP;

  -- Simpler approach: use a set-based merge with generate_series of months
  -- Count distinct months across all intervals
  SELECT COUNT(DISTINCT m) INTO total_months
  FROM (
    SELECT generate_series(
      intervals[idx][1],
      intervals[idx][2],
      '1 month'::interval
    )::date AS m
    FROM generate_subscripts(intervals, 1) AS idx
  ) sub;

  RETURN LEAST(GREATEST(0, ROUND(total_months / 12.0)::integer), max_reasonable_years);
END;
$$;

-- Re-backfill with corrected calculation
UPDATE public.profiles
SET years_experience = public.calculate_years_experience(experience)
WHERE experience IS NOT NULL AND jsonb_array_length(experience) > 0;
