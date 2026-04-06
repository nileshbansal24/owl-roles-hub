
CREATE TABLE public.recruiter_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'verification',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_candidate_id UUID,
  related_candidate_name TEXT,
  related_credential_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruiter_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view their own notifications"
  ON public.recruiter_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update their own notifications"
  ON public.recruiter_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can insert their own notifications"
  ON public.recruiter_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can delete their own notifications"
  ON public.recruiter_notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Admins can view all notifications"
  ON public.recruiter_notifications
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_recruiter_notifications_recruiter ON public.recruiter_notifications (recruiter_id, is_read, created_at DESC);
