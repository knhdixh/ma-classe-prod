-- Keep-alive: Supabase pauses free projects after 7 days without activity.
-- Each pinger (the daily Vercel cron, the GitHub Actions backup) upserts its own row, so pinging never grows the table.
create table if not exists public.heartbeats (
  source text primary key check (source in ('vercel-cron', 'github-actions')),
  at timestamptz not null default now(),
  count bigint not null default 1
);

-- RLS with no policies: nobody reads or writes the table directly; heartbeat() below is the only way in.
alter table public.heartbeats enable row level security;

-- Called with the publishable (anon) key. An unknown source fails the check constraint.
-- Empty search_path: everything is named in full.
create or replace function public.heartbeat(source text) returns timestamptz
language sql
security definer
set search_path = ''
as $$
  insert into public.heartbeats as h (source) values (heartbeat.source)
  on conflict (source) do update set at = pg_catalog.now(), count = h.count + 1
  returning h.at;
$$;

revoke all on function public.heartbeat(text) from public;
grant execute on function public.heartbeat(text) to anon, authenticated;
