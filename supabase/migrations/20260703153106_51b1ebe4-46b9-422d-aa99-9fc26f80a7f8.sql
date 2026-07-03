
CREATE TABLE public.password_reset_otps (
  email text PRIMARY KEY,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.password_reset_otps TO service_role;
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;
-- No client policies; only service role edge functions access this table.
