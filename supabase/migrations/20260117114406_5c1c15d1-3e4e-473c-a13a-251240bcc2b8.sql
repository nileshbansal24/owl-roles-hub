-- Create interviews table for scheduling
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  job_id UUID NOT NULL,
  proposed_times JSONB NOT NULL DEFAULT '[]'::jsonb,
  confirmed_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
  interview_type TEXT DEFAULT 'video' CHECK (interview_type IN ('video', 'phone', 'in_person')),
  meeting_link TEXT,
  location TEXT,
  notes TEXT,
  recruiter_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Recruiters can create interviews for their job applications
CREATE POLICY "Recruiters can create interviews for their jobs"
ON public.interviews
FOR INSERT
WITH CHECK (
  auth.uid() = recruiter_id AND
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = interviews.job_id 
    AND jobs.created_by = auth.uid()
  )
);

-- Recruiters can view interviews they created
CREATE POLICY "Recruiters can view their interviews"
ON public.interviews
FOR SELECT
USING (auth.uid() = recruiter_id);

-- Recruiters can update interviews they created
CREATE POLICY "Recruiters can update their interviews"
ON public.interviews
FOR UPDATE
USING (auth.uid() = recruiter_id);

-- Recruiters can delete interviews they created
CREATE POLICY "Recruiters can delete their interviews"
ON public.interviews
FOR DELETE
USING (auth.uid() = recruiter_id);

-- Candidates can view interviews scheduled for them
CREATE POLICY "Candidates can view their interviews"
ON public.interviews
FOR SELECT
USING (auth.uid() = candidate_id);

-- Candidates can update their interviews (to confirm/decline)
CREATE POLICY "Candidates can respond to their interviews"
ON public.interviews
FOR UPDATE
USING (auth.uid() = candidate_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_interviews_updated_at
BEFORE UPDATE ON public.interviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();