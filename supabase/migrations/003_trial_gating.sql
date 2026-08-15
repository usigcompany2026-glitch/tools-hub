-- Documents a change that was applied directly to production and is being
-- backfilled into migration history here so the repo matches reality.
--
-- 001_init.sql shipped a monthly free-use-cap model (3 residential / 1
-- commercial / 5 financing analyses per month, forever, on plan = 'free').
-- Production was switched to a 7-day free trial model instead: every new
-- signup gets `trial_ends_at = now() + 7 days` on each of their three
-- subscription rows, and can_run() grants access while now() < trial_ends_at
-- rather than counting usage_events. usage_events / record_usage() are left
-- in place (record_usage is still called by the app) but no longer gate
-- access — can_run() does not consult usage_events at all under this model.

alter table subscriptions
  add column if not exists trial_ends_at timestamptz;

-- New signup gets a 7-day trial row for all three tools (was: plain 'free'
-- row with no expiry).
create or replace function handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.subscriptions (user_id, product, plan, status, trial_ends_at)
  values (new.id,'residential','free','active', now() + interval '7 days'),
         (new.id,'commercial','free','active', now() + interval '7 days'),
         (new.id,'financing','free','active', now() + interval '7 days');
  return new;
end $$;

-- Gate on trial_ends_at instead of a monthly usage_events count.
-- Returned `plan` values: 'paid' | 'trial' | 'trial_expired' | 'no_account'
-- (was: 'paid' | 'free', with a separate used/limit pair for the free case).
create or replace function can_run(p_user uuid, p_product text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_plan text; v_status text; v_period timestamptz; v_trial_ends timestamptz;
begin
  if auth.uid() is null or p_user <> auth.uid() then
    raise exception 'not authorized';
  end if;

  select plan, status, current_period_end, trial_ends_at
    into v_plan, v_status, v_period, v_trial_ends
    from subscriptions where user_id = p_user and product = p_product;

  if v_plan is null then
    return jsonb_build_object('allowed', false, 'plan', 'no_account', 'reason', 'no_account');
  end if;

  if v_plan = 'paid' and v_status = 'active'
     and (v_period is null or v_period > now()) then
    return jsonb_build_object('allowed', true, 'plan', 'paid');
  end if;

  if v_trial_ends is not null and now() < v_trial_ends then
    return jsonb_build_object('allowed', true, 'plan', 'trial', 'trial_ends_at', v_trial_ends);
  end if;

  return jsonb_build_object(
    'allowed', false, 'plan', 'trial_expired', 'reason', 'trial_expired',
    'trial_ends_at', v_trial_ends
  );
end $$;

-- Unchanged in behavior from 001_init.sql — included here only so this
-- migration is a complete, re-runnable snapshot of the metering functions.
create or replace function record_usage(p_user uuid, p_product text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or p_user <> auth.uid() then
    raise exception 'not authorized';
  end if;

  insert into public.usage_events (user_id, product, period_month)
  values (p_user, p_product, to_char(now(),'YYYY-MM'));
end $$;

revoke all on function can_run(uuid, text) from public;
revoke all on function record_usage(uuid, text) from public;
revoke execute on function can_run(uuid, text) from anon;
revoke execute on function record_usage(uuid, text) from anon;
grant execute on function can_run(uuid, text) to authenticated;
grant execute on function record_usage(uuid, text) to authenticated;

alter function handle_new_user() set search_path = public, pg_temp;
revoke execute on function handle_new_user() from public, anon, authenticated;

-- Known additional drift NOT covered by this migration (applied directly to
-- production, not yet backfilled into migration history):
--   profiles: sphere_url, lead_notify_email, welcome_email_sent_at,
--             welcome_email_resend_id, broker_slug
--   leads:    first_name, last_name
-- Flagging here rather than guessing at their exact types/defaults blind.
