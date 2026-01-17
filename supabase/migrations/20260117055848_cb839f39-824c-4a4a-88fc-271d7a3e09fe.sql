-- Create recruiter_notes table for private notes on applicants
CREATE TABLE public.recruiter_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL,
  applicant_id UUID NOT NULL,
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recruiter_notes ENABLE ROW LEVEL SECURITY;

-- Recruiters can only view their own notes
CREATE POLICY "Recruiters can view their own notes"
ON public.recruiter_notes
FOR SELECT
USING (auth.uid() = recruiter_id);

-- Recruiters can create notes for applicants to their jobs
CREATE POLICY "Recruiters can create notes for their job applicants"
ON public.recruiter_notes
FOR INSERT
WITH CHECK (
  auth.uid() = recruiter_id
  AND EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.jobs j ON ja.job_id = j.id
    WHERE ja.id = application_id
    AND j.created_by = auth.uid()
  )
);

-- Recruiters can update their own notes
CREATE POLICY "Recruiters can update their own notes"
ON public.recruiter_notes
FOR UPDATE
USING (auth.uid() = recruiter_id);

-- Recruiters can delete their own notes
CREATE POLICY "Recruiters can delete their own notes"
ON public.recruiter_notes
FOR DELETE
USING (auth.uid() = recruiter_id);

-- Add trigger for updated_at
CREATE TRIGGER update_recruiter_notes_updated_at
BEFORE UPDATE ON public.recruiter_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_recruiter_notes_application ON public.recruiter_notes(application_id);
CREATE INDEX idx_recruiter_notes_recruiter ON public.recruiter_notes(recruiter_id);