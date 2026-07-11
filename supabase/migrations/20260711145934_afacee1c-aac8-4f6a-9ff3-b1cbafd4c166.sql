
CREATE TABLE public.recruiter_whatsapp_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text UNIQUE,
  pairing_code text NOT NULL UNIQUE,
  linked boolean NOT NULL DEFAULT false,
  linked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruiter_whatsapp_links TO authenticated;
GRANT ALL ON public.recruiter_whatsapp_links TO service_role;

ALTER TABLE public.recruiter_whatsapp_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters view own whatsapp link"
  ON public.recruiter_whatsapp_links FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters insert own whatsapp link"
  ON public.recruiter_whatsapp_links FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters update own whatsapp link"
  ON public.recruiter_whatsapp_links FOR UPDATE
  TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters delete own whatsapp link"
  ON public.recruiter_whatsapp_links FOR DELETE
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE TRIGGER update_recruiter_whatsapp_links_updated_at
  BEFORE UPDATE ON public.recruiter_whatsapp_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_recruiter_whatsapp_links_phone ON public.recruiter_whatsapp_links(phone_number);
CREATE INDEX idx_recruiter_whatsapp_links_code ON public.recruiter_whatsapp_links(pairing_code);
