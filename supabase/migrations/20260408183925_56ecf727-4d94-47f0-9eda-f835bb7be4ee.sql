
-- Fix the security definer view issue
DROP VIEW IF EXISTS public.event_questions_safe;

CREATE VIEW public.event_questions_safe
WITH (security_invoker = true)
AS
SELECT id, event_id, question_text, question_type, options, order_index, points, created_at
FROM public.event_questions;
