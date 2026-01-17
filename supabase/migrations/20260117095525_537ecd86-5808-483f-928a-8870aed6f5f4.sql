-- Convert existing public resume URLs to file paths
-- Old format: https://xxx.supabase.co/storage/v1/object/public/resumes/{user_id}/resume.{ext}?t=xxx
-- New format: {user_id}/resume.{ext}

UPDATE public.profiles
SET resume_url = 
  CASE 
    -- Extract path from full public URL (handles both with and without query params)
    WHEN resume_url LIKE '%/storage/v1/object/public/resumes/%' THEN
      regexp_replace(
        split_part(resume_url, '/storage/v1/object/public/resumes/', 2),
        '\?.*$', -- Remove query params like ?t=timestamp
        ''
      )
    -- Already a path (doesn't contain full URL pattern)
    ELSE resume_url
  END
WHERE resume_url IS NOT NULL
  AND resume_url LIKE '%/storage/v1/object/public/resumes/%';