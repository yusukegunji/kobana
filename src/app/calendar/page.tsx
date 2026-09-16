import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { todayInJST } from "@/lib/date";
import {
  MEMBER_SELECT,
  filterFacilitatorCandidates,
} from "@/lib/member-status";
import type { FacilitatorSchedule, MemberRow, UserDayOff } from "@/lib/types";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const supabase = await createServerClient();

  // 今月の前後2ヶ月分のスケジュールを取得
  const now = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const startDate = fmt(new Date(now.getFullYear(), now.getMonth() - 2, 1));
  const endDate = fmt(new Date(now.getFullYear(), now.getMonth() + 3, 0));

  // 互いに依存しないので並列で投げる（往復回数がそのまま TTFB に積み上がる）
  const [schedulesRes, daysOffRes, userRes, profilesRes] = await Promise.all([
    supabase
      .from("facilitator_schedule")
      .select("*")
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .order("scheduled_date", { ascending: true }),

    // 休み予定
    supabase
      .from("user_days_off")
      .select("*")
      .gte("off_date", startDate)
      .lte("off_date", endDate)
      .order("off_date", { ascending: true }),

    // ログインユーザー
    supabase.auth.getUser(),

    // 全メンバー（退職者を含む）を profiles から取得
    supabase
      .from("profiles")
      .select(MEMBER_SELECT)
      .order("display_name", { ascending: true }),
  ]);

  const schedules = schedulesRes.data;
  const daysOff = daysOffRes.data;
  const user = userRes.data.user;

  // allMembers は過去の担当者名・休み申請者名の解決用（退職者を含む全員）
  // facilitatorCandidates は担当割当とローテーションの選択肢用
  const today = todayInJST();
  const allMembers = (profilesRes.data as MemberRow[] | null) ?? [];
  const facilitatorCandidates = filterFacilitatorCandidates(allMembers, today);

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-md px-3 py-1.5 text-sm text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-200"
            >
              ← ホーム
            </Link>
            <h1 className="text-2xl font-bold text-stone-100">
              ファシリテーター担当カレンダー
            </h1>
          </div>
          <Link
            href="/kobanashi"
            className="rounded-md px-3 py-1.5 text-sm text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-200"
          >
            ダッシュボード
          </Link>
        </div>

        <CalendarView
          initialSchedules={(schedules as FacilitatorSchedule[]) ?? []}
          members={facilitatorCandidates}
          allMembers={allMembers}
          initialDaysOff={(daysOff as UserDayOff[]) ?? []}
          currentUserId={user?.id ?? null}
          todayJST={today}
        />
      </div>
    </div>
  );
}
