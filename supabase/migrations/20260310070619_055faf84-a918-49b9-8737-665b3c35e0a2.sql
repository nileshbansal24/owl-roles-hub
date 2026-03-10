
-- Fix search_path for calculate_years_experience
ALTER FUNCTION public.calculate_years_experience(jsonb) SET search_path = public;
