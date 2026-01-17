-- Create saved_candidates table for recruiters to bookmark profiles
CREATE TABLE public.saved_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(recruiter_id, candidate_id)
);

-- Enable RLS
ALTER TABLE public.saved_candidates ENABLE ROW LEVEL SECURITY;

-- Recruiters can only see their own saved candidates
CREATE POLICY "Recruiters can view their saved candidates"
ON public.saved_candidates
FOR SELECT
USING (auth.uid() = recruiter_id);

-- Recruiters can save candidates
CREATE POLICY "Recruiters can save candidates"
ON public.saved_candidates
FOR INSERT
WITH CHECK (auth.uid() = recruiter_id);

-- Recruiters can update notes on their saved candidates
CREATE POLICY "Recruiters can update their saved candidates"
ON public.saved_candidates
FOR UPDATE
USING (auth.uid() = recruiter_id);

-- Recruiters can remove saved candidates
CREATE POLICY "Recruiters can delete their saved candidates"
ON public.saved_candidates
FOR DELETE
USING (auth.uid() = recruiter_id);

-- Add index for faster lookups
CREATE INDEX idx_saved_candidates_recruiter ON public.saved_candidates(recruiter_id);
CREATE INDEX idx_saved_candidates_candidate ON public.saved_candidates(candidate_id);