-- ============================================================
-- Tickets Feature Migration
-- Run this in the Supabase SQL editor after database.sql
-- ============================================================

begin;

-- 1) Tickets table
create table if not exists public.tickets (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  subject       text not null,
  description   text not null,
  status        text not null default 'open'
                  check (status in ('open', 'in_progress', 'closed')),
  priority      text not null default 'medium'
                  check (priority in ('low', 'medium', 'high')),
  order_id      bigint references public.product_orders(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.tickets is 'Support tickets submitted by users.';

-- 2) Ticket messages table (threaded replies)
create table if not exists public.ticket_messages (
  id            bigserial primary key,
  ticket_id     bigint not null references public.tickets(id) on delete cascade,
  sender_id     uuid not null references auth.users(id) on delete cascade,
  message       text not null,
  is_admin_reply boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.ticket_messages is 'Messages/replies within a support ticket thread.';

-- 3) Auto-update updated_at on tickets
drop trigger if exists set_updated_at_tickets on public.tickets;
create trigger set_updated_at_tickets
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- 4) Indexes
create index if not exists tickets_user_id_idx      on public.tickets (user_id);
create index if not exists tickets_status_idx        on public.tickets (status);
create index if not exists ticket_messages_ticket_idx on public.ticket_messages (ticket_id);

-- 5) RLS for tickets
alter table public.tickets enable row level security;

-- Users can read their own tickets
drop policy if exists "Users can read own tickets" on public.tickets;
create policy "Users can read own tickets" on public.tickets
  for select
  using (auth.uid() = user_id);

-- Users can insert their own tickets
drop policy if exists "Users can insert own tickets" on public.tickets;
create policy "Users can insert own tickets" on public.tickets
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own tickets (e.g. close)
drop policy if exists "Users can update own tickets" on public.tickets;
create policy "Users can update own tickets" on public.tickets
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can read all tickets
drop policy if exists "Admins can read all tickets" on public.tickets;
create policy "Admins can read all tickets" on public.tickets
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Admins can update any ticket (status, priority)
drop policy if exists "Admins can update any ticket" on public.tickets;
create policy "Admins can update any ticket" on public.tickets
  for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 6) RLS for ticket_messages
alter table public.ticket_messages enable row level security;

-- Users can read messages for their own tickets
drop policy if exists "Users can read own ticket messages" on public.ticket_messages;
create policy "Users can read own ticket messages" on public.ticket_messages
  for select
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

-- Users can insert messages on their own tickets
drop policy if exists "Users can insert messages on own tickets" on public.ticket_messages;
create policy "Users can insert messages on own tickets" on public.ticket_messages
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

-- Admins can read all ticket messages
drop policy if exists "Admins can read all ticket messages" on public.ticket_messages;
create policy "Admins can read all ticket messages" on public.ticket_messages
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Admins can insert messages on any ticket
drop policy if exists "Admins can insert messages on any ticket" on public.ticket_messages;
create policy "Admins can insert messages on any ticket" on public.ticket_messages
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

commit;
