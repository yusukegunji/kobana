-- ============================================================
-- Live Poll（ライブ投票）機能のマイグレーション
-- 発表者が聞き手全員に投票を促す。リアルタイムで集計が見える。
-- 適用手順: Supabase SQL Editor でこのファイルを実行する。
-- ============================================================

create type poll_kind as enum ('yesno', 'multi');
create type poll_status as enum ('live', 'ended');

-- 投票本体（同時に複数あり得るが、画面では最新の live を表示する）
create table polls (
  id           uuid primary key default uuid_generate_v4(),
  question     text not null,
  kind         poll_kind not null default 'yesno',
  status       poll_status not null default 'live',
  kobanashi_id uuid references kobanashi(id) on delete set null,
  created_by   uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  ended_at     timestamptz
);

create index idx_polls_status_created on polls (status, created_at desc);

-- 選択肢（最大4つ。yesno は2つ）
create table poll_options (
  id         uuid primary key default uuid_generate_v4(),
  poll_id    uuid not null references polls(id) on delete cascade,
  label      text not null,
  color      text not null,
  position   smallint not null default 0,
  created_at timestamptz not null default now()
);

create index idx_poll_options_poll on poll_options (poll_id, position);

-- 票（1人1票、変更可。upsert で更新する）
create table poll_votes (
  id         uuid primary key default uuid_generate_v4(),
  poll_id    uuid not null references polls(id) on delete cascade,
  option_id  uuid not null references poll_options(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create index idx_poll_votes_poll on poll_votes (poll_id);

create trigger poll_votes_updated_at
  before update on poll_votes
  for each row execute function update_updated_at();

-- Realtime を有効化
alter publication supabase_realtime add table polls;
alter publication supabase_realtime add table poll_votes;

-- 票の変更（option_id の差し替え）を Realtime の old レコードで判定できるようにする
alter table poll_votes replica identity full;

-- RLS ポリシー
alter table polls enable row level security;
create policy "polls_select" on polls for select to authenticated using (true);
create policy "polls_insert" on polls for insert to authenticated with check (auth.uid() = created_by);
create policy "polls_update" on polls for update to authenticated using (true);

alter table poll_options enable row level security;
create policy "poll_options_select" on poll_options for select to authenticated using (true);
create policy "poll_options_insert" on poll_options for insert to authenticated with check (true);

alter table poll_votes enable row level security;
create policy "poll_votes_select" on poll_votes for select to authenticated using (true);
create policy "poll_votes_insert" on poll_votes for insert to authenticated with check (auth.uid() = user_id);
create policy "poll_votes_update" on poll_votes for update to authenticated using (auth.uid() = user_id);
create policy "poll_votes_delete" on poll_votes for delete to authenticated using (auth.uid() = user_id);
