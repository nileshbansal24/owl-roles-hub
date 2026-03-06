
-- Table to store recruiter-driven credential verifications
CREATE TABLE public.credential_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_type text NOT NULL CHECK (credential_type IN ('education', 'employment', 'certification', 'achievement')),
  credential_title text NOT NULL,
  credential_issuer text,
  status text NOT NULL DEFAULT 'unverified' CHECK (status IN ('verified', 'pending', 'unverified', 'rejected')),
  verification_notes text,
  verification_link text,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(recruiter_id, candidate_id, credential_type, credential_title)
);

ALTER TABLE public.credential_verifications ENABLE ROW LEVEL SECURITY;

-- Recruiters can manage their own verifications
CREATE POLICY "Recruiters can view their own verifications"
  ON public.credential_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can insert verifications"
  ON public.credential_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = recruiter_id AND is_recruiter(auth.uid()));

CREATE POLICY "Recruiters can update their own verifications"
  ON public.credential_verifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can delete their own verifications"
  ON public.credential_verifications FOR DELETE
  TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Admins can view all credential verifications"
  ON public.credential_verifications FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_credential_verifications_updated_at
  BEFORE UPDATE ON public.credential_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
