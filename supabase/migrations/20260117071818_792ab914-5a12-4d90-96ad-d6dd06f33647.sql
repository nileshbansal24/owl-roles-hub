-- Add applicant_email column to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN applicant_email text;