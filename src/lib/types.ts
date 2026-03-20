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
