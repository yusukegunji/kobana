-- ============================================================
-- 「それ正解」（お題に全員が一斉回答するゲーム）機能のマイグレーション
-- 司会（本日のファシリテーター）がお題を出し、全員が一斉に回答する。
-- 司会が締め切ると回答が一斉公開され、司会が独断で「正解」をマークする。
-- 適用手順: Supabase SQL Editor でこのファイルを実行する。
-- ============================================================

create type seikai_status as enum ('answering', 'revealed');

-- ゲーム本体（お題1つ = 1ゲーム。画面には最新の1件だけを表示する）
create table seikai_games (
  id                uuid primary key default uuid_generate_v4(),
  theme             text not null,
  status            seikai_status not null default 'answering',
  host_id           uuid not null references profiles(id) on delete cascade,
  -- 締切前は他人の回答を読めないよう RLS で伏せる（下部のポリシー参照）。
  -- 「誰が回答済みか」だけは全員に見せたいので、本文を含まないこの列に持たせ、
  -- seikai_answers のトリガで同期する。
  answered_user_ids uuid[] not null default '{}',
  created_at        timestamptz not null default now(),
  revealed_at       timestamptz
);

create index idx_seikai_games_created on seikai_games (created_at desc);

-- 回答（1人1回答。締切前は本人のみ書き換え可）
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

-- 回答済みユーザーをゲーム行へ同期する
-- （upsert による回答の書き換えは UPDATE 扱いなので発火しない = 二重登録されない）
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
alter publication supabase_realtime add table seikai_games;
alter publication supabase_realtime add table seikai_answers;

-- RLS ポリシー
alter table seikai_games enable row level security;
create policy "seikai_games_select" on seikai_games for select to authenticated using (true);
create policy "seikai_games_insert" on seikai_games for insert to authenticated with check (auth.uid() = host_id);
create policy "seikai_games_update" on seikai_games for update to authenticated using (true);

alter table seikai_answers enable row level security;

-- 締切前は自分の回答しか読めない。公開後は全員分が読める。
-- Realtime の postgres_changes もこのポリシーで絞られるため、締切前に
-- 他人の回答がクライアントへ配信されることはない（ゲームの前提条件）。
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

-- 締切前は自分の回答の書き直しのみ。公開後は司会が正解をマークできる。
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
