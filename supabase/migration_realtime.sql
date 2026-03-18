-- リアルタイム機能のためのマイグレーション
-- 既存のSupabaseプロジェクトに対して実行してください

-- 現在のOnAir状態テーブル
create table if not exists current_onair (
  id             uuid primary key default uuid_generate_v4(),
  kobanashi_id   uuid not null references kobanashi(id) on delete cascade,
  started_by     uuid not null references profiles(id) on delete cascade,
  started_at     timestamptz not null default now()
);

-- RLS
alter table current_onair enable row level security;
create policy "onair_select" on current_onair for select to authenticated using (true);
create policy "onair_insert" on current_onair for insert to authenticated with check (true);
create policy "onair_delete" on current_onair for delete to authenticated using (true);

-- Realtime を有効化
alter publication supabase_realtime add table current_onair;
alter publication supabase_realtime add table kobanashi_fabulous;
