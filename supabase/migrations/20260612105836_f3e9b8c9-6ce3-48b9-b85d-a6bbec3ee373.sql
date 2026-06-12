ALTER TABLE public.saved_candidates ADD COLUMN IF NOT EXISTS folder text;
CREATE INDEX IF NOT EXISTS idx_saved_candidates_recruiter_folder ON public.saved_candidates (recruiter_id, folder);