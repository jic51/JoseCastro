-- supabase/schema.sql
-- DentAccept MVP Database (No PHI stored)

-- Offices table
create table offices (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  plan text default 'starter' check (plan in ('starter', 'practice', 'group')),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text default 'trial' check (status in ('trial', 'active', 'past_due', 'cancelled')),
  trial_ends_at timestamp with time zone default now() + interval '14 days',
  settings jsonb default '{}'::jsonb
);

-- Presentations (analytics only, no patient data)
create table presentations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  office_id uuid references offices(id),
  procedure_id text not null,
  procedure_name text not null,
  language text default 'en',
  completed boolean default false,
  scheduled boolean default false,
  declined boolean default false,
  device_type text default 'tablet'
);

-- Monthly aggregated stats (for dashboard)
create table monthly_stats (
  id uuid default gen_random_uuid() primary key,
  office_id uuid references offices(id),
  month date not null,
  total_presentations integer default 0,
  completed_presentations integer default 0,
  scheduled_count integer default 0,
  acceptance_rate decimal(5,2),
  revenue_impact decimal(10,2),
  unique(office_id, month)
);

-- RLS Policies
alter table offices enable row level security;
alter table presentations enable row level security;
alter table monthly_stats enable row level security;

create policy "Offices can read own data"
  on offices for select using (auth.uid() in (
    select auth.uid() from auth.users where email in (
      select email from office_users where office_id = offices.id
    )
  ));

-- Function to track presentation
create or replace function track_presentation(
  p_office_id uuid,
  p_procedure_id text,
  p_procedure_name text,
  p_language text,
  p_outcome text
) returns void as $$
begin
  insert into presentations (office_id, procedure_id, procedure_name, language, completed, scheduled, declined)
  values (
    p_office_id,
    p_procedure_id,
    p_procedure_name,
    p_language,
    p_outcome = 'completed',
    p_outcome = 'scheduled',
    p_outcome = 'declined'
  );
end;
$$ language plpgsql security definer;