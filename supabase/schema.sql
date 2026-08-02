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
  slack_user_id  text unique,
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

-- ユーザー休み予定
create table user_days_off (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references profiles(id) on delete cascade,
  off_date       date not null,
  created_at     timestamptz not null default now(),
  unique (user_id, off_date)
);

create index idx_user_days_off_date on user_days_off (off_date);

-- ライブ投票（発表者が聞き手全員に投票を促す機能）
-- 詳細・マイグレーション手順は supabase/migration_polls.sql を参照
create type poll_kind as enum ('yesno', 'multi');
create type poll_status as enum ('live', 'ended');

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

create table poll_options (
  id         uuid primary key default uuid_generate_v4(),
  poll_id    uuid not null references polls(id) on delete cascade,
  label      text not null,
  color      text not null,
  position   smallint not null default 0,
  created_at timestamptz not null default now()
);

create index idx_poll_options_poll on poll_options (poll_id, position);

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

alter table poll_votes replica identity full;

-- それ正解（お題に全員が一斉回答するゲーム）
-- 詳細・マイグレーション手順は supabase/migration_seikai.sql を参照
create type seikai_status as enum ('answering', 'revealed');

create table seikai_games (
  id                uuid primary key default uuid_generate_v4(),
  theme             text not null,
  status            seikai_status not null default 'answering',
  host_id           uuid not null references profiles(id) on delete cascade,
  -- 締切前は回答本文を RLS で伏せるため、「誰が回答済みか」だけをここに持つ
  answered_user_ids uuid[] not null default '{}',
  created_at        timestamptz not null default now(),
  revealed_at       timestamptz
);

create index idx_seikai_games_created on seikai_games (created_at desc);

create table seikai_answers (
  id         uuid primary key default uuid_generate_v4(),
  game_id    uuid not null references seikai_games(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  body       text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, user_id)
);

create index idx_seikai_answers_game on seikai_answers (game_id);

create trigger seikai_answers_updated_at
  before update on seikai_answers
  for each row execute function update_updated_at();

create or replace function sync_seikai_answered_users()
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    update seikai_games
       set answered_user_ids = array_remove(answered_user_ids, old.user_id)
     where id = old.game_id;
    return old;
  end if;

  update seikai_games
     set answered_user_ids = array_append(answered_user_ids, new.user_id)
   where id = new.game_id
     and not (new.user_id = any (answered_user_ids));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger seikai_answers_sync_answered
  after insert or delete on seikai_answers
  for each row execute function sync_seikai_answered_users();

-- Realtime を有効化
alter publication supabase_realtime add table current_onair;
alter publication supabase_realtime add table kobanashi_fabulous;
alter publication supabase_realtime add table polls;
alter publication supabase_realtime add table poll_votes;
alter publication supabase_realtime add table seikai_games;
alter publication supabase_realtime add table seikai_answers;

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

alter table user_days_off enable row level security;
create policy "days_off_select" on user_days_off for select to authenticated using (true);
create policy "days_off_insert" on user_days_off for insert to authenticated with check (auth.uid() = user_id);
create policy "days_off_delete" on user_days_off for delete to authenticated using (auth.uid() = user_id);

alter table current_onair enable row level security;
create policy "onair_select" on current_onair for select to authenticated using (true);
create policy "onair_insert" on current_onair for insert to authenticated with check (true);
create policy "onair_delete" on current_onair for delete to authenticated using (true);

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

alter table seikai_games enable row level security;
create policy "seikai_games_select" on seikai_games for select to authenticated using (true);
create policy "seikai_games_insert" on seikai_games for insert to authenticated with check (auth.uid() = host_id);
create policy "seikai_games_update" on seikai_games for update to authenticated using (true);

alter table seikai_answers enable row level security;

-- 締切前は自分の回答しか読めない（Realtime の配信もこのポリシーで絞られる）。
-- 公開後は全員分が読め、司会が正解をマークできる。
create policy "seikai_answers_select" on seikai_answers for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from seikai_games g
      where g.id = seikai_answers.game_id and g.status = 'revealed'
    )
  );

create policy "seikai_answers_insert" on seikai_answers for insert to authenticated
  with check (auth.uid() = user_id);

create policy "seikai_answers_update" on seikai_answers for update to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from seikai_games g
      where g.id = seikai_answers.game_id and g.status = 'revealed'
    )
  );

create policy "seikai_answers_delete" on seikai_answers for delete to authenticated
  using (auth.uid() = user_id);
