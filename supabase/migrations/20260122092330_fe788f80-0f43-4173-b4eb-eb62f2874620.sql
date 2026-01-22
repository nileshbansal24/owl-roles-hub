-- Add manual_h_index field for users who don't use Scopus
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS manual_h_index integer DEFAULT NULL;

COMMENT ON COLUMN public.profiles.manual_h_index IS 'Manually entered h-index for users without Scopus integration';