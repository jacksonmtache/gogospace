-- Track that the payer was emailed after a successful checkout.
alter table public.payments
  add column if not exists customer_notified_at timestamptz;
