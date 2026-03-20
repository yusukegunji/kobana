import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import type { FacilitatorSchedule, Profile, UserDayOff } from "@/lib/types";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const supabase = await createServerClient();

  // 今月の前後2ヶ月分のスケジュールを取得
  const now = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const startDate = fmt(new Date(now.getFullYear(), now.getMonth() - 2, 1));
  const endDate = fmt(new Date(now.getFullYear(), now.getMonth() + 3, 0));

  const { data: schedules } = await supabase
    .from("facilitator_schedule")
    .select("*")
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_date", { ascending: true });

  // 休み予定を取得
  const { data: daysOff } = await supabase
    .from("user_days_off")
    .select("*")
    .gte("off_date", startDate)
    .lte("off_date", endDate)
    .order("off_date", { ascending: true });

  // ログインユーザー
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 全メンバーを profiles から取得
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("display_name", { ascending: true });

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
          members={(profiles as Pick<Profile, "id" | "display_name">[]) ?? []}
          initialDaysOff={(daysOff as UserDayOff[]) ?? []}
          currentUserId={user?.id ?? null}
        />
      </div>
    </div>
  );
}
