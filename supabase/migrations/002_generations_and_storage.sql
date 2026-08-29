-- Generations, credit debit/refund RPCs, and a private designs storage bucket.
-- Credits remain writable only via security-definer RPCs (service role).

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  style text,
  aspect_ratio text not null,
  original_path text not null,
  result_path text,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'generating', 'completed', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.generations is 'Per-user interior redesign jobs and storage paths';

create index if not exists generations_user_id_created_at_idx
  on public.generations (user_id, created_at desc);

drop trigger if exists set_generations_updated_at on public.generations;
create trigger set_generations_updated_at
  before update on public.generations
  for each row execute procedure public.set_updated_at();

alter table public.generations enable row level security;

drop policy if exists "Users can read own generations" on public.generations;
create policy "Users can read own generations"
  on public.generations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own generations" on public.generations;
create policy "Users can insert own generations"
  on public.generations
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own generations" on public.generations;
create policy "Users can update own generations"
  on public.generations
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on table public.generations to authenticated;

-- Atomic credit mutations. Not granted to anon/authenticated.
create or replace function public.debit_one_credit(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  update public.profiles
  set credits = credits - 1
  where id = p_user_id and credits >= 1
  returning credits into new_balance;

  return new_balance;
end;
$$;

create or replace function public.refund_one_credit(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  update public.profiles
  set credits = credits + 1
  where id = p_user_id
  returning credits into new_balance;

  return new_balance;
end;
$$;

revoke all on function public.debit_one_credit(uuid) from public, anon, authenticated;
revoke all on function public.refund_one_credit(uuid) from public, anon, authenticated;
grant execute on function public.debit_one_credit(uuid) to service_role;
grant execute on function public.refund_one_credit(uuid) to service_role;

-- Private storage: only the owning user can access objects under {user_id}/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'designs',
  'designs',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own designs" on storage.objects;
create policy "Users can upload own designs"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'designs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can read own designs" on storage.objects;
create policy "Users can read own designs"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'designs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can update own designs" on storage.objects;
create policy "Users can update own designs"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'designs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'designs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete own designs" on storage.objects;
create policy "Users can delete own designs"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'designs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
