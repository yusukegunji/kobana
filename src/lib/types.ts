export type KobanashiStatus = "未対応" | "対応済" | "凍結" | "対応不要";

export interface Kobanashi {
  id: string;
  title: string;
  speaker: string;
  status: KobanashiStatus;
  notes: string | null;
  scheduled_date: string | null;
  published_at: string | null;
  duration: number | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  slack_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FacilitatorSchedule {
  id: string;
  scheduled_date: string;
  user_id: string;
  created_at: string;
}

export interface KobanashiFabulous {
  id: string;
  kobanashi_id: string;
  user_id: string;
  created_at: string;
}

export interface CurrentOnAir {
  id: string;
  kobanashi_id: string;
  started_by: string;
  started_at: string;
}

export interface UserDayOff {
  id: string;
  user_id: string;
  off_date: string;
  created_at: string;
}

export interface KobanashiWithFabulous extends Kobanashi {
  fabulous_count: number;
  has_fabuloused: boolean;
}

// --- ライブ投票 ---
export type PollKind = "yesno" | "multi";
export type PollStatus = "live" | "ended";

export interface Poll {
  id: string;
  question: string;
  kind: PollKind;
  status: PollStatus;
  kobanashi_id: string | null;
  created_by: string;
  created_at: string;
  ended_at: string | null;
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  color: string;
  position: number;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// クライアントで集計済みの選択肢
export interface PollOptionResult {
  id: string;
  label: string;
  color: string;
  votes: number;
}

// 1人が投票したことを示す軽量な情報（プレゼンス表示用）
export interface PollVoter {
  userId: string;
  name: string;
}

// --- それ正解（お題に全員が一斉回答するゲーム） ---
export type SeikaiStatus = "answering" | "revealed";

export interface SeikaiGame {
  id: string;
  theme: string;
  status: SeikaiStatus;
  host_id: string;
  // 回答済みユーザー。締切前は回答本文が読めないため、プレゼンス表示に使う
  answered_user_ids: string[];
  created_at: string;
  revealed_at: string | null;
}

export interface SeikaiAnswer {
  id: string;
  game_id: string;
  user_id: string;
  body: string;
  is_correct: boolean;
  created_at: string;
  updated_at: string;
}

// 表示名を解決済みの回答（公開後の一覧表示用）
export interface SeikaiAnswerView extends SeikaiAnswer {
  name: string;
}

// 今日の正解数ランキングの1行
export interface SeikaiScore {
  userId: string;
  name: string;
  correctCount: number;
}

// ゲームに参加しうるメンバー（profiles の最小形）
export interface SeikaiMember {
  id: string;
  display_name: string;
}
