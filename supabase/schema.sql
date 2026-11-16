create table if not exists public.bimo_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  request_count integer not null default 0,
  primary key (user_id, usage_date)
);
alter table public.bimo_daily_usage enable row level security;
revoke all on public.bimo_daily_usage from anon, authenticated;
create or replace function public.bimo_consume_quota(max_daily integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if max_daily < 1 or max_daily > 200 then raise exception 'invalid limit'; end if;
  insert into public.bimo_daily_usage(user_id, usage_date, request_count)
  values(auth.uid(), (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_date)
  do update set request_count = public.bimo_daily_usage.request_count + 1
  where public.bimo_daily_usage.request_count < max_daily
  returning request_count into n;
  return n is not null;
end;
$$;
revoke all on function public.bimo_consume_quota(integer) from public, anon;
grant execute on function public.bimo_consume_quota(integer) to authenticated;

create table if not exists public.bimo_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.bimo_user_data enable row level security;
create policy "bimo_owner_read" on public.bimo_user_data for select to authenticated using (auth.uid() = user_id);
create policy "bimo_owner_insert" on public.bimo_user_data for insert to authenticated with check (auth.uid() = user_id);
create policy "bimo_owner_update" on public.bimo_user_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
