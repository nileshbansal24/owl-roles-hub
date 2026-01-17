-- Make resumes bucket private
UPDATE storage.buckets SET public = false WHERE id = 'resumes';