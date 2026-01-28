-- Create institution verification status table
CREATE TABLE public.institution_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_at timestamp with time zone,
  verification_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.institution_verifications ENABLE ROW LEVEL SECURITY;

-- Recruiters can view their own verification status
CREATE POLICY "Users can view their own verification status"
ON public.institution_verifications
FOR SELECT
USING (auth.uid() = recruiter_id);

-- Recruiters can request verification (insert)
CREATE POLICY "Users can request verification"
ON public.institution_verifications
FOR INSERT
WITH CHECK (auth.uid() = recruiter_id);

-- Create function to check if recruiter is verified
CREATE OR REPLACE FUNCTION public.is_verified_recruiter(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.institution_verifications
    WHERE recruiter_id = _user_id
    AND status = 'verified'
  )
$$;

-- Create updated_at trigger
CREATE TRIGGER update_institution_verifications_updated_at
BEFORE UPDATE ON public.institution_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();