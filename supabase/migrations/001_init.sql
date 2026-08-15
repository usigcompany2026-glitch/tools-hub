create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  phone text,
  company text,
  user_type text,              -- investor | agent | mortgage_broker | loan_officer | cre_broker | other
  nmls_id text,                -- required for financing tool output personalization
  dre_license text,
  display_name text,           -- name shown on personalized financing outputs
  created_at timestamptz default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  product text not null,                   -- residential | commercial | financing
  plan text not null default 'free',       -- free | paid
  -- A 'paid' row with stripe_subscription_id null is complimentary access
  -- (e.g. a Financing Analysis loan originator comped in via an automation-
  -- service subscription), granted by hand — see README "Financing access".
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'active',   -- active | past_due | canceled
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  updated_at timestamptz default now(),
  unique (user_id, product)
);

create table usage_events (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  product text not null,
  period_month text not null,              -- 'YYYY-MM'
  created_at timestamptz default now()
);
create index on usage_events (user_id, product, period_month);

create table leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  email text not null,
  phone text,
  source_tool text,
  intent text,                 -- advisory | custom_work | financing | question
  message text,
  status text default 'new',
  created_at timestamptz default now()
);

alter table profiles      enable row level security;
alter table subscriptions enable row level security;
alter table usage_events  enable row level security;
alter table leads         enable row level security;

create policy "own profile"    on profiles      for all    using (auth.uid() = id);
create policy "read own subs"  on subscriptions for select using (auth.uid() = user_id);
create policy "read own usage" on usage_events  for select using (auth.uid() = user_id);
create policy "insert lead"    on leads         for insert with check (true);

-- New signup gets a free row for all three tools
create or replace function handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.subscriptions (user_id, product, plan, status)
  values (new.id,'residential','free','active'),
         (new.id,'commercial','free','active'),
         (new.id,'financing','free','active');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Server-side metering. Never replicate this logic client-side.
create or replace function can_run(p_user uuid, p_product text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_plan text; v_status text; v_period timestamptz;
        v_used int; v_limit int;
begin
  -- auth.uid() is NULL for an anonymous caller, and in PL/pgSQL an IF
  -- condition that evaluates to NULL is treated as false — so checking
  -- only `p_user <> auth.uid()` would silently let anon calls through.
  if auth.uid() is null or p_user <> auth.uid() then
    raise exception 'not authorized';
  end if;

  select plan, status, current_period_end
    into v_plan, v_status, v_period
    from subscriptions where user_id = p_user and product = p_product;

  if v_plan is null then
    return jsonb_build_object('allowed', false, 'reason','no_account');
  end if;

  if v_plan = 'paid' and v_status = 'active'
     and (v_period is null or v_period > now()) then
    return jsonb_build_object('allowed', true, 'plan','paid', 'limit', null);
  end if;

  select count(*) into v_used from usage_events
   where user_id = p_user and product = p_product
     and period_month = to_char(now(),'YYYY-MM');

  v_limit := case p_product
    when 'residential' then 3
    when 'commercial'  then 1
    when 'financing'   then 5
    else 0 end;

  return jsonb_build_object(
    'allowed', v_used < v_limit,
    'plan','free','used', v_used,'limit', v_limit,
    'reason', case when v_used < v_limit then null else 'limit_reached' end
  );
end $$;

create or replace function record_usage(p_user uuid, p_product text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or p_user <> auth.uid() then
    raise exception 'not authorized';
  end if;

  insert into public.usage_events (user_id, product, period_month)
  values (p_user, p_product, to_char(now(),'YYYY-MM'));
end $$;

-- Callable by any signed-in user (guarded above); anon/public cannot call these.
-- `revoke ... from public` alone is not enough on Supabase: new functions get
-- direct EXECUTE grants to anon/authenticated via default privileges at
-- creation time, which a PUBLIC-role revoke does not touch — anon needs an
-- explicit revoke too.
revoke all on function can_run(uuid, text) from public;
revoke all on function record_usage(uuid, text) from public;
revoke execute on function can_run(uuid, text) from anon;
revoke execute on function record_usage(uuid, text) from anon;
grant execute on function can_run(uuid, text) to authenticated;
grant execute on function record_usage(uuid, text) to authenticated;

-- Trigger-only function (reads NEW, only valid when fired by the trigger
-- below) — has no business being callable directly via
-- /rest/v1/rpc/handle_new_user.
alter function handle_new_user() set search_path = public, pg_temp;
revoke execute on function handle_new_user() from public, anon, authenticated;
