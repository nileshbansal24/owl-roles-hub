
-- Create trigger function to auto-calculate years_experience from experience JSON
CREATE OR REPLACE FUNCTION public.auto_calculate_years_experience()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_years integer;
BEGIN
  -- Calculate years from experience JSON
  calculated_years := public.calculate_years_experience(NEW.experience);
  
  -- Update years_experience
  NEW.years_experience := calculated_years;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on profiles table
DROP TRIGGER IF EXISTS trigger_auto_calculate_experience ON public.profiles;
CREATE TRIGGER trigger_auto_calculate_experience
  BEFORE INSERT OR UPDATE OF experience
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_calculate_years_experience();

-- Backfill: recalculate years_experience for all existing profiles with experience data
UPDATE public.profiles
SET years_experience = public.calculate_years_experience(experience)
WHERE experience IS NOT NULL AND jsonb_array_length(experience) > 0;
