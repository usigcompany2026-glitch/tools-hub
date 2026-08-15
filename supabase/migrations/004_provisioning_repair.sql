-- Self-heal for accounts that exist in auth.users but were never provisioned
-- app-side.
--
-- Why this is needed: 003's handle_new_user() trigger is the ONLY thing that
-- creates a user's profiles row and their three subscriptions rows. If a user
-- is created by any path where that trigger did not run (or ran before the
-- trigger existed), the account is permanently stranded: can_run() finds no
-- subscriptions row, returns plan = 'no_account' for all three products, and
-- the Hub shows no launch access anywhere. The user can sign in perfectly
-- well and still reach nothing. There was no repair path — this adds one.
--
-- This is a repair, not a rule change. It re-applies exactly what
-- handle_new_user() would have written:
--   * the same three products
--   * plan 'free', status 'active'
--   * a 7-day trial measured from the account's own created_at, NOT from now
-- An account created more than 7 days ago therefore heals into an already-
-- expired trial, which is the correct outcome. Nobody gets a fresh or
-- extended trial out of this.
--
-- Idempotent and safe to call on every authenticated page load: existing rows
-- are never touched (no UPDATE, no DELETE, ON CONFLICT DO NOTHING), so paid
-- plans, Stripe linkage, and real trial dates are all preserved.

create or replace function ensure_provisioned()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_created timestamptz;
begin
  if v_user is null then
    raise exception 'not authorized';
  end if;

  select email, created_at into v_email, v_created
    from auth.users where id = v_user;

  if v_email is null then
    return;
  end if;

  -- subscriptions.user_id references profiles(id), so the profile has to
  -- land first.
  insert into public.profiles (id, email)
  values (v_user, v_email)
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, product, plan, status, trial_ends_at)
  select v_user, p.product, 'free', 'active', v_created + interval '7 days'
    from (values ('residential'), ('commercial'), ('financing')) as p(product)
  on conflict (user_id, product) do nothing;
end $$;

revoke all on function ensure_provisioned() from public;
revoke execute on function ensure_provisioned() from anon;
grant execute on function ensure_provisioned() to authenticated;
