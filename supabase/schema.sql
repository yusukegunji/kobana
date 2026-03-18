create extension if not exists "uuid-ossp";

create type kobanashi_status as enum ('未対応', '対応済', '凍結', '対応不要');

create table kobanashi (
  id             uuid primary key default uuid_generate_v4(),
  title          text not null,
  speaker        text not null,
  status         kobanashi_status not null default '未対応',
  notes          text,
  scheduled_date date,
  published_at   timestamptz,
  duration       smallint,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- updated_at 自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger kobanashi_updated_at
  before update on kobanashi
  for each row execute function update_updated_at();

create index idx_kobanashi_scheduled_date on kobanashi (scheduled_date desc);
create index idx_kobanashi_status on kobanashi (status);

-- ユーザープロフィール
create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  display_name   text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ファシリテーター担当スケジュール
create table facilitator_schedule (
  id             uuid primary key default uuid_generate_v4(),
  scheduled_date date not null unique,
  user_id        uuid not null references profiles(id) on delete cascade,
  created_at     timestamptz not null default now()
);

create index idx_facilitator_schedule_date on facilitator_schedule (scheduled_date desc);

-- ファビュラス（いいね）
create table kobanashi_fabulous (
  id             uuid primary key default uuid_generate_v4(),
  kobanashi_id   uuid not null references kobanashi(id) on delete cascade,
  user_id        uuid not null references profiles(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (kobanashi_id, user_id)
);

create index idx_fabulous_kobanashi on kobanashi_fabulous (kobanashi_id);

-- 現在のOnAir状態（同時に1つだけ）
create table current_onair (
  id             uuid primary key default uuid_generate_v4(),
  kobanashi_id   uuid not null references kobanashi(id) on delete cascade,
  started_by     uuid not null references profiles(id) on delete cascade,
  started_at     timestamptz not null default now()
);

-- Realtime を有効化
alter publication supabase_realtime add table current_onair;
alter publication supabase_realtime add table kobanashi_fabulous;

-- RLS ポリシー: 認証済みユーザーは全データを読み書き可能
alter table profiles enable row level security;
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_insert" on profiles for insert to authenticated with check (true);
create policy "profiles_update" on profiles for update to authenticated using (true);

alter table facilitator_schedule enable row level security;
create policy "facilitator_schedule_select" on facilitator_schedule for select to authenticated using (true);
create policy "facilitator_schedule_insert" on facilitator_schedule for insert to authenticated with check (true);
create policy "facilitator_schedule_update" on facilitator_schedule for update to authenticated using (true);
create policy "facilitator_schedule_delete" on facilitator_schedule for delete to authenticated using (true);

alter table kobanashi_fabulous enable row level security;
create policy "fabulous_select" on kobanashi_fabulous for select to authenticated using (true);
create policy "fabulous_insert" on kobanashi_fabulous for insert to authenticated with check (auth.uid() = user_id);
create policy "fabulous_delete" on kobanashi_fabulous for delete to authenticated using (auth.uid() = user_id);

alter table current_onair enable row level security;
create policy "onair_select" on current_onair for select to authenticated using (true);
create policy "onair_insert" on current_onair for insert to authenticated with check (true);
create policy "onair_delete" on current_onair for delete to authenticated using (true);
