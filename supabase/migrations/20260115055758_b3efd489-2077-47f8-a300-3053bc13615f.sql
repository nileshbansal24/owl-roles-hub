-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate applications
CREATE UNIQUE INDEX unique_job_application ON public.job_applications(job_id, applicant_id);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can view their own applications
CREATE POLICY "Applicants can view their own applications"
ON public.job_applications
FOR SELECT
TO authenticated
USING (auth.uid() = applicant_id);

-- Job creators can view applications for their jobs
CREATE POLICY "Job owners can view applications for their jobs"
ON public.job_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_applications.job_id 
    AND jobs.created_by = auth.uid()
  )
);

-- Users can create applications
CREATE POLICY "Users can create applications"
ON public.job_applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = applicant_id);

-- Job owners can update application status
CREATE POLICY "Job owners can update application status"
ON public.job_applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_applications.job_id 
    AND jobs.created_by = auth.uid()
  )
);

-- Applicants can delete their own applications
CREATE POLICY "Applicants can delete their own applications"
ON public.job_applications
FOR DELETE
TO authenticated
USING (auth.uid() = applicant_id);

-- Add trigger for updated_at
CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample job listings
INSERT INTO public.jobs (title, institute, location, salary_range, job_type, tags, description) VALUES
('Associate Professor - Computer Science', 'Lovely Professional University (LPU)', 'Phagwara, Punjab', '₹12L - ₹18L p.a.', 'Full Time', ARRAY['Computer Science', 'AI/ML', 'Research'], 'We are looking for an experienced Associate Professor to lead our Computer Science department. The ideal candidate should have a strong research background in AI/ML.'),
('Assistant Professor - Physics', 'Chandigarh University (CU)', 'Mohali, Punjab', '₹8L - ₹14L p.a.', 'Full Time', ARRAY['Physics', 'Quantum Mechanics', 'Teaching'], 'Join our vibrant Physics department. We seek passionate educators with expertise in Quantum Mechanics and Condensed Matter Physics.'),
('Professor - Management Studies', 'Chitkara University', 'Rajpura, Punjab', '₹18L - ₹25L p.a.', 'Full Time', ARRAY['MBA', 'Leadership', 'Strategy'], 'Lead our Management department with your expertise. Looking for candidates with industry experience and academic excellence.'),
('Research Fellow - Biotechnology', 'Amity University', 'Noida, UP', '₹10L - ₹15L p.a.', 'Contract', ARRAY['Biotechnology', 'Research', 'PhD'], 'Exciting research opportunity in our state-of-the-art Biotechnology lab. Work on cutting-edge genetic research projects.'),
('Lecturer - Data Science', 'Lovely Professional University (LPU)', 'Phagwara, Punjab', '₹6L - ₹10L p.a.', 'Full Time', ARRAY['Data Science', 'Python', 'Statistics'], 'Teach the next generation of data scientists. Strong Python and statistical modeling skills required.'),
('Assistant Professor - English Literature', 'Chandigarh University (CU)', 'Mohali, Punjab', '₹7L - ₹12L p.a.', 'Full Time', ARRAY['English', 'Literature', 'Communication'], 'Join our English department to inspire students through literature and effective communication skills.'),
('Dean - Engineering', 'Chitkara University', 'Rajpura, Punjab', '₹30L - ₹45L p.a.', 'Full Time', ARRAY['Engineering', 'Leadership', 'Administration'], 'Lead our Engineering faculty as Dean. Requires 15+ years of academic and administrative experience.'),
('Visiting Faculty - Artificial Intelligence', 'Amity University', 'Noida, UP', '₹4L - ₹8L p.a.', 'Part Time', ARRAY['AI', 'Machine Learning', 'Neural Networks'], 'Share your AI expertise as a visiting faculty member. Flexible schedule for industry professionals.');