-- Create table for storing candidate rankings by recruiters
CREATE TABLE public.candidate_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  rankings JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(recruiter_id, job_id)
);

-- Enable Row Level Security
ALTER TABLE public.candidate_rankings ENABLE ROW LEVEL SECURITY;

-- Create policies for recruiter access only
CREATE POLICY "Recruiters can view their own rankings" 
ON public.candidate_rankings 
FOR SELECT 
USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can create their own rankings" 
ON public.candidate_rankings 
FOR INSERT 
WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update their own rankings" 
ON public.candidate_rankings 
FOR UPDATE 
USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can delete their own rankings" 
ON public.candidate_rankings 
FOR DELETE 
USING (auth.uid() = recruiter_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_candidate_rankings_updated_at
BEFORE UPDATE ON public.candidate_rankings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();