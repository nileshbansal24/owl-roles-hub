-- Add Scopus author metrics fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS scopus_metrics jsonb DEFAULT NULL;

-- The scopus_metrics column will store:
-- {
--   "h_index": number,
--   "document_count": number,
--   "citation_count": number,
--   "co_authors": [{ "name": string, "author_id": string, "affiliation": string }]
-- }

COMMENT ON COLUMN public.profiles.scopus_metrics IS 'Scopus author metrics including h-index, document count, and co-authors';