-- Create table for storing recruiter messages with analytics
CREATE TABLE public.recruiter_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  job_title TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  opened_at TIMESTAMP WITH TIME ZONE,
  open_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recruiter_messages ENABLE ROW LEVEL SECURITY;

-- Recruiters can view their own messages
CREATE POLICY "Recruiters can view their own messages"
ON public.recruiter_messages
FOR SELECT
USING (auth.uid() = recruiter_id);

-- Recruiters can create messages
CREATE POLICY "Recruiters can create messages"
ON public.recruiter_messages
FOR INSERT
WITH CHECK (auth.uid() = recruiter_id);

-- Recruiters can update their own messages
CREATE POLICY "Recruiters can update their own messages"
ON public.recruiter_messages
FOR UPDATE
USING (auth.uid() = recruiter_id);

-- Create trigger for updated_at
CREATE TRIGGER update_recruiter_messages_updated_at
BEFORE UPDATE ON public.recruiter_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_recruiter_messages_recruiter_id ON public.recruiter_messages(recruiter_id);
CREATE INDEX idx_recruiter_messages_candidate_id ON public.recruiter_messages(candidate_id);
CREATE INDEX idx_recruiter_messages_created_at ON public.recruiter_messages(created_at DESC);