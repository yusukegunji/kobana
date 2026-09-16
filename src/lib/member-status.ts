// メンバーの在籍判定と候補の絞り込み
//
// profiles.left_at は退職日。null なら在籍中、日付が入っていればその日までは在籍として扱う。
// DB の date 型は YYYY-MM-DD 文字列で返るため、todayInJST() との辞書順比較がそのまま日付比較になる。
//
// left_at が「チームから抜けた＝全機能から外す」のに対し、exclude_from_* は在籍したまま
// 特定の候補からだけ外すフラグ。
//
// ここで絞り込んだリストは「ユーザーを選ぶ選択肢」にだけ使う。
// 過去の記録の名前解決（担当履歴・投票者名・回答者名）には退職者を含む全員を使うこと。

import { todayInJST } from "./date";
import type { MemberRow } from "./types";

// profiles の取得で使う共通の select 句
export const MEMBER_SELECT =
  "id, display_name, left_at, exclude_from_speaker, exclude_from_facilitator";

export function isActiveMember(
  leftAt: string | null,
  today: string = todayInJST(),
): boolean {
  return leftAt === null || leftAt >= today;
}

// 小噺の発表者候補（ルーレット・指名）。
// 聴衆カウントとそれ正解の回答母数もこのリストに揃える。
export function filterSpeakerCandidates<
  T extends Pick<MemberRow, "left_at" | "exclude_from_speaker">,
>(members: T[], today: string = todayInJST()): T[] {
  return members.filter(
    (m) => isActiveMember(m.left_at, today) && !m.exclude_from_speaker,
  );
}

// ファシリテーター候補（カレンダーの担当割当・ローテーション）
export function filterFacilitatorCandidates<
  T extends Pick<MemberRow, "left_at" | "exclude_from_facilitator">,
>(members: T[], today: string = todayInJST()): T[] {
  return members.filter(
    (m) => isActiveMember(m.left_at, today) && !m.exclude_from_facilitator,
  );
}
