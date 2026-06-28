
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier text;

CREATE OR REPLACE FUNCTION public.compute_candidate_tier(_years integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _years IS NULL OR _years <= 0 THEN 'Black'
    WHEN _years BETWEEN 1 AND 4 THEN 'Bronze'
    WHEN _years BETWEEN 5 AND 9 THEN 'Silver'
    ELSE 'Gold'
  END
$$;

CREATE OR REPLACE FUNCTION public.auto_set_years_and_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_years integer;
BEGIN
  IF NEW.experience IS NOT NULL THEN
    calculated_years := public.calculate_years_experience(NEW.experience);
    NEW.years_experience := calculated_years;
  END IF;
  NEW.tier := public.compute_candidate_tier(COALESCE(NEW.years_experience, 0));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_years_tier ON public.profiles;
CREATE TRIGGER trg_auto_years_tier
BEFORE INSERT OR UPDATE OF experience, years_experience ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_set_years_and_tier();

-- Backfill existing rows
UPDATE public.profiles
SET tier = public.compute_candidate_tier(COALESCE(years_experience, 0))
WHERE tier IS NULL;
