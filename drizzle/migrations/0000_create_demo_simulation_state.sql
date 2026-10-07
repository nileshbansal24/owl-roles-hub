CREATE TABLE public.demo_simulation_state (
  id text PRIMARY KEY DEFAULT 'owlroles' CHECK (id = 'owlroles'),
  enabled boolean NOT NULL DEFAULT false,
  candidates jsonb NOT NULL DEFAULT '[]'::jsonb,
  jobs jsonb NOT NULL DEFAULT '[]'::jsonb,
  activity jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_simulation_state TO authenticated;
GRANT ALL ON public.demo_simulation_state TO service_role;
ALTER TABLE public.demo_simulation_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage demo simulation state"
  ON public.demo_simulation_state
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));