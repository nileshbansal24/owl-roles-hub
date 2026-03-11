
-- Add proof document columns to institution_verifications
ALTER TABLE public.institution_verifications 
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS proof_file_name text;

-- Create RLS policy for verification-proofs in credentials bucket
-- Recruiters can upload their verification proofs
CREATE POLICY "Recruiters can upload verification proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'credentials' 
  AND (storage.foldername(name))[1] = 'verification-proofs'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Recruiters can view their own verification proofs
CREATE POLICY "Recruiters can view own verification proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'credentials' 
  AND (storage.foldername(name))[1] = 'verification-proofs'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Admins can view all verification proofs
CREATE POLICY "Admins can view all verification proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'credentials' 
  AND (storage.foldername(name))[1] = 'verification-proofs'
  AND public.has_role(auth.uid(), 'admin')
);
