-- 在籍したまま候補から外すためのマイグレーション
-- 既存のSupabaseプロジェクトに対して SQL Editor で実行してください
-- （退職日 left_at は supabase/migration_member_left_at.sql を参照）
--
-- left_at が「チームから抜けた＝全機能から外す」のに対し、こちらは在籍したまま
-- 特定の候補からだけ外す操作。既存のファシリテーター割当は削除しない（いつでも戻せるため）。
--
-- exclude_from_speaker      : ルーレット・指名の候補から外す。
--                             聴衆カウントとそれ正解の回答母数もこれに連動する
-- exclude_from_facilitator  : カレンダーの担当割当とローテーション候補から外す

alter table profiles
  add column if not exists exclude_from_speaker boolean not null default false;

alter table profiles
  add column if not exists exclude_from_facilitator boolean not null default false;

-- RLS は既存の profiles_update（for update to authenticated using (true)）をそのまま使う
