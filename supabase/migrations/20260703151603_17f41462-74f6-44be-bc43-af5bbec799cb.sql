
create table if not exists public.signup_otps (
  email text primary key,
  code_hash text not null,
  pending_data jsonb not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

grant all on public.signup_otps to service_role;

alter table public.signup_otps enable row level security;
