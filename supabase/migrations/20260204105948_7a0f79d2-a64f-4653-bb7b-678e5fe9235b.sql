-- Create event types enum
CREATE TYPE public.event_type AS ENUM ('webinar', 'quiz', 'assignment');

-- Create event status enum  
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');

-- Create question type enum for quizzes
CREATE TYPE public.question_type AS ENUM ('mcq', 'short_answer');

-- Main events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  status event_status NOT NULL DEFAULT 'draft',
  -- Webinar specific fields
  meeting_link TEXT,
  platform TEXT, -- 'google_meet', 'zoom', 'other'
  -- Scheduling
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  -- Quiz specific fields
  time_limit_minutes INTEGER, -- null = no time limit
  -- Assignment specific fields
  submission_deadline TIMESTAMP WITH TIME ZONE,
  max_file_size_mb INTEGER DEFAULT 10,
  allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx'],
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quiz questions table
CREATE TABLE public.event_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL DEFAULT 'mcq',
  options JSONB, -- For MCQ: ["Option A", "Option B", "Option C", "Option D"]
  correct_answer TEXT, -- For MCQ: index or text; For short_answer: expected answer (optional)
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event registrations (for webinars) / Participation tracking
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered', -- registered, attended, cancelled
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attended_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(event_id, candidate_id)
);

-- Quiz submissions
CREATE TABLE public.quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}', -- { "question_id": "answer" }
  score INTEGER,
  max_score INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES auth.users(id),
  UNIQUE(event_id, candidate_id)
);

-- Assignment submissions
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  score INTEGER,
  max_score INTEGER DEFAULT 100,
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES auth.users(id),
  UNIQUE(event_id, candidate_id)
);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Recruiters can manage their own events"
ON public.events FOR ALL
USING (auth.uid() = recruiter_id)
WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Candidates can view published events for jobs they applied to"
ON public.events FOR SELECT
USING (
  status = 'published' AND
  EXISTS (
    SELECT 1 FROM public.job_applications
    WHERE job_applications.job_id = events.job_id
    AND job_applications.applicant_id = auth.uid()
  )
);

-- Event questions policies
CREATE POLICY "Recruiters can manage questions for their events"
ON public.event_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_questions.event_id
    AND events.recruiter_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_questions.event_id
    AND events.recruiter_id = auth.uid()
  )
);

CREATE POLICY "Candidates can view questions for events they can access"
ON public.event_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.job_applications ja ON ja.job_id = e.job_id
    WHERE e.id = event_questions.event_id
    AND e.status = 'published'
    AND ja.applicant_id = auth.uid()
  )
);

-- Event registrations policies
CREATE POLICY "Candidates can register for accessible events"
ON public.event_registrations FOR INSERT
WITH CHECK (
  auth.uid() = candidate_id AND
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.job_applications ja ON ja.job_id = e.job_id
    WHERE e.id = event_registrations.event_id
    AND e.status = 'published'
    AND e.event_type = 'webinar'
    AND ja.applicant_id = auth.uid()
  )
);

CREATE POLICY "Candidates can view their own registrations"
ON public.event_registrations FOR SELECT
USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can update their own registrations"
ON public.event_registrations FOR UPDATE
USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters can view registrations for their events"
ON public.event_registrations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_registrations.event_id
    AND events.recruiter_id = auth.uid()
  )
);

-- Quiz submissions policies
CREATE POLICY "Candidates can submit quizzes for accessible events"
ON public.quiz_submissions FOR INSERT
WITH CHECK (
  auth.uid() = candidate_id AND
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.job_applications ja ON ja.job_id = e.job_id
    WHERE e.id = quiz_submissions.event_id
    AND e.status = 'published'
    AND e.event_type = 'quiz'
    AND ja.applicant_id = auth.uid()
  )
);

CREATE POLICY "Candidates can view and update their own quiz submissions"
ON public.quiz_submissions FOR SELECT
USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can update their own unsubmitted quizzes"
ON public.quiz_submissions FOR UPDATE
USING (auth.uid() = candidate_id AND submitted_at IS NULL);

CREATE POLICY "Recruiters can view and grade quiz submissions for their events"
ON public.quiz_submissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = quiz_submissions.event_id
    AND events.recruiter_id = auth.uid()
  )
);

-- Assignment submissions policies
CREATE POLICY "Candidates can submit assignments for accessible events"
ON public.assignment_submissions FOR INSERT
WITH CHECK (
  auth.uid() = candidate_id AND
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.job_applications ja ON ja.job_id = e.job_id
    WHERE e.id = assignment_submissions.event_id
    AND e.status = 'published'
    AND e.event_type = 'assignment'
    AND ja.applicant_id = auth.uid()
  )
);

CREATE POLICY "Candidates can view their own assignment submissions"
ON public.assignment_submissions FOR SELECT
USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters can view and grade assignment submissions for their events"
ON public.assignment_submissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = assignment_submissions.event_id
    AND events.recruiter_id = auth.uid()
  )
);

-- Create storage bucket for assignment submissions
INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', false);

-- Storage policies for assignments bucket
CREATE POLICY "Candidates can upload assignment files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Candidates can view their own assignment files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Recruiters can view assignment files for their events"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignments' AND
  EXISTS (
    SELECT 1 FROM public.assignment_submissions asub
    JOIN public.events e ON e.id = asub.event_id
    WHERE asub.file_url LIKE '%' || storage.filename(name) || '%'
    AND e.recruiter_id = auth.uid()
  )
);

-- Add updated_at trigger for events
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();