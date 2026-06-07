ALTER TABLE public.saved_candidates ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'saved';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_candidates_status_check') THEN
    ALTER TABLE public.saved_candidates ADD CONSTRAINT saved_candidates_status_check CHECK (status IN ('saved','shortlisted','maybe','rejected'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_saved_candidates_status ON public.saved_candidates(recruiter_id, status);