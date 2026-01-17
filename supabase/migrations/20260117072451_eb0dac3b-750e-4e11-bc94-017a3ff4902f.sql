-- Delete orphaned sample jobs with NULL created_by
DELETE FROM public.jobs WHERE created_by IS NULL;

-- Add NOT NULL constraint to prevent future orphaned records
ALTER TABLE public.jobs ALTER COLUMN created_by SET NOT NULL;