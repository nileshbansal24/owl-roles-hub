
CREATE TABLE public.plan_upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_plan TEXT NOT NULL DEFAULT 'free',
  requested_plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.plan_upgrade_requests TO authenticated;
GRANT ALL ON public.plan_upgrade_requests TO service_role;

ALTER TABLE public.plan_upgrade_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own upgrade requests"
ON public.plan_upgrade_requests FOR SELECT
TO authenticated
USING (auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters can create own upgrade requests"
ON public.plan_upgrade_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = recruiter_id AND status = 'pending');

CREATE POLICY "Admins can update upgrade requests"
ON public.plan_upgrade_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_plan_upgrade_requests_recruiter ON public.plan_upgrade_requests(recruiter_id);
CREATE INDEX idx_plan_upgrade_requests_status ON public.plan_upgrade_requests(status);

CREATE TRIGGER update_plan_upgrade_requests_updated_at
BEFORE UPDATE ON public.plan_upgrade_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Apply approved upgrades to profiles automatically
CREATE OR REPLACE FUNCTION public.apply_approved_plan_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.profiles
    SET subscription_plan = NEW.requested_plan
    WHERE id = NEW.recruiter_id;
    NEW.reviewed_at := COALESCE(NEW.reviewed_at, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER apply_approved_plan_upgrade_trg
BEFORE UPDATE ON public.plan_upgrade_requests
FOR EACH ROW EXECUTE FUNCTION public.apply_approved_plan_upgrade();

-- Lock down execute
REVOKE EXECUTE ON FUNCTION public.apply_approved_plan_upgrade() FROM PUBLIC, anon;
