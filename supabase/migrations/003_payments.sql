-- Payments ledger, credit grants, and case-insensitive profile email lookup.
-- Credits remain writable only via security-definer RPCs (service role).

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  email text not null,
  user_id uuid references auth.users (id) on delete set null,
  plan_id text not null,
  credits integer not null check (credits > 0),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'credited', 'failed')),
  credits_granted_at timestamptz,
  admin_notified_at timestamptz,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.payments is 'Stripe Checkout purchases and credit fulfillment state';

create index if not exists payments_user_id_created_at_idx
  on public.payments (user_id, created_at desc);

create index if not exists payments_email_idx
  on public.payments (lower(email));

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
  before update on public.payments
  for each row execute procedure public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists "Users can read own payments" on public.payments;
create policy "Users can read own payments"
  on public.payments
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on table public.payments to authenticated;

-- Case-insensitive unique emails for post-checkout account matching.
create unique index if not exists profiles_email_lower_idx
  on public.profiles (lower(email))
  where coalesce(email, '') <> '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, lower(coalesce(new.email, '')), 0)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.add_credits(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'credit amount must be positive';
  end if;

  update public.profiles
  set credits = credits + p_amount
  where id = p_user_id
  returning credits into new_balance;

  if new_balance is null then
    raise exception 'profile not found';
  end if;

  return new_balance;
end;
$$;

create or replace function public.find_profile_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where lower(email) = lower(trim(p_email))
  limit 1;
$$;

create or replace function public.claim_payment_credits(p_session_id text, p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_row public.payments%rowtype;
  new_balance integer;
begin
  select * into payment_row
  from public.payments
  where stripe_checkout_session_id = p_session_id
  for update;

  if not found then
    raise exception 'payment not found';
  end if;

  if payment_row.status = 'failed' then
    raise exception 'payment is not paid';
  end if;

  if payment_row.credits_granted_at is not null then
    if payment_row.user_id = p_user_id then
      select credits into new_balance from public.profiles where id = p_user_id;
      return new_balance;
    end if;
    raise exception 'payment already claimed';
  end if;

  update public.profiles
  set credits = credits + payment_row.credits
  where id = p_user_id
  returning credits into new_balance;

  if new_balance is null then
    raise exception 'profile not found';
  end if;

  update public.payments
  set
    user_id = p_user_id,
    status = 'credited',
    credits_granted_at = now()
  where stripe_checkout_session_id = p_session_id;

  return new_balance;
end;
$$;

revoke all on function public.add_credits(uuid, integer) from public, anon, authenticated;
revoke all on function public.find_profile_id_by_email(text) from public, anon, authenticated;
revoke all on function public.claim_payment_credits(text, uuid) from public, anon, authenticated;

grant execute on function public.add_credits(uuid, integer) to service_role;
grant execute on function public.find_profile_id_by_email(text) to service_role;
grant execute on function public.claim_payment_credits(text, uuid) to service_role;
