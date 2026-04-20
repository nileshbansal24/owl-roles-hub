ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS recruiter_onboarding_completed boolean NOT NULL DEFAULT false;