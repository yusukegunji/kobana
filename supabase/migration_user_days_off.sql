-- ============================================
-- 1. profiles に slack_user_id カラム追加
-- ============================================
alter table profiles add column if not exists slack_user_id text unique;

-- ============================================
-- 2. ユーザー休み予定テーブル
-- ============================================
create table if not exists user_days_off (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references profiles(id) on delete cascade,
  off_date       date not null,
  created_at     timestamptz not null default now(),
  unique (user_id, off_date)
);

create index if not exists idx_user_days_off_date on user_days_off (off_date);

-- RLS
alter table user_days_off enable row level security;
create policy "days_off_select" on user_days_off for select to authenticated using (true);
create policy "days_off_insert" on user_days_off for insert to authenticated with check (auth.uid() = user_id);
create policy "days_off_delete" on user_days_off for delete to authenticated using (auth.uid() = user_id);
