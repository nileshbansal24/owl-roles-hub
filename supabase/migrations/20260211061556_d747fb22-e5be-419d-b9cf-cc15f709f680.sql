
-- Allow admins to view all events
CREATE POLICY "Admins can view all events"
ON public.events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all event registrations
CREATE POLICY "Admins can view all event registrations"
ON public.event_registrations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all saved candidates
CREATE POLICY "Admins can view all saved candidates"
ON public.saved_candidates
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all event questions
CREATE POLICY "Admins can view all event questions"
ON public.event_questions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all quiz submissions
CREATE POLICY "Admins can view all quiz submissions"
ON public.quiz_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all assignment submissions
CREATE POLICY "Admins can view all assignment submissions"
ON public.assignment_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all recruiter notes
CREATE POLICY "Admins can view all recruiter notes"
ON public.recruiter_notes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all candidate rankings
CREATE POLICY "Admins can view all candidate rankings"
ON public.candidate_rankings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all candidate directory entries
CREATE POLICY "Admins can view all candidate directory"
ON public.candidate_directory
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
