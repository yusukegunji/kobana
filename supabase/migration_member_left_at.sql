-- チームメンバーの退職日（left_at）を管理するためのマイグレーション
-- 既存のSupabaseプロジェクトに対して SQL Editor で実行してください
--
-- left_at が NULL、または今日以降なら「在籍中」として扱う（退職日当日までは在籍）。
-- 在籍中のメンバーだけをルーレット・指名・担当割当などの「選択肢」に出し、
-- 過去の記録（担当履歴・投票者名など）の名前解決には退職者も含めた全員を使う。

-- ============================================
-- 1. profiles に left_at カラム追加（退職日）
-- ============================================
alter table profiles add column if not exists left_at date;

-- ============================================
-- 2. 退職日を設定したら、その日以降のファシリテーター担当を自動で外す
-- ============================================
-- Server Action で profiles の update と facilitator_schedule の delete を
-- 2クエリに分けると、後者が失敗したときに「退職日だけ入って担当が残る」不整合が
-- 起きうるため、同一 UPDATE 内で完結するトリガーにする。
create or replace function remove_future_facilitator_assignments()
returns trigger as $$
begin
  -- left_at 当日までは在籍扱い（src/lib/member-status.ts の isActiveMember と揃える）
  -- なので、外すのは退職日の「翌日以降」の担当だけ
  if new.left_at is not null and (old.left_at is distinct from new.left_at) then
    delete from facilitator_schedule
     where user_id = new.id
       and scheduled_date > new.left_at;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists profiles_remove_future_facilitator on profiles;
create trigger profiles_remove_future_facilitator
  after update on profiles
  for each row execute function remove_future_facilitator_assignments();

-- RLS は既存の profiles_update（for update to authenticated using (true)）をそのまま使う。
-- 認証済みユーザーなら誰でも他人の退職日を設定できる想定のため、追加ポリシーは不要。
