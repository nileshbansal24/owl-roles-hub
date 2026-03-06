
-- Storage bucket for credential documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('credentials', 'credentials', false);

-- Storage RLS: candidates can upload their own credential docs
CREATE POLICY "Users can upload their own credentials"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'credentials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own credentials"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'credentials' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Recruiters can view credential documents
CREATE POLICY "Recruiters can view credential documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'credentials' AND is_recruiter(auth.uid()));

-- Add document hash and file columns to credential_verifications
ALTER TABLE public.credential_verifications
  ADD COLUMN IF NOT EXISTS document_hash text,
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_name text,
  ADD COLUMN IF NOT EXISTS hash_algorithm text DEFAULT 'SHA-256',
  ADD COLUMN IF NOT EXISTS anchored_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id);

-- Allow candidates to insert their own credential verifications (self-upload)
CREATE POLICY "Candidates can insert their own credential records"
  ON public.credential_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = candidate_id AND auth.uid() = uploaded_by);

-- Allow candidates to view verifications about themselves
CREATE POLICY "Candidates can view their own verifications"
  ON public.credential_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = candidate_id);
