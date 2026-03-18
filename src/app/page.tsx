import { createServerClient } from "@/lib/supabase/server";
import type { Kobanashi, KobanashiWithFabulous } from "@/lib/types";
import { HomeStage } from "./home-stage";

async function attachFabulous(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  items: Kobanashi[],
  currentUserId: string | null,
): Promise<KobanashiWithFabulous[]> {
  if (items.length === 0) return [];
  const ids = items.map((i) => i.id);

  // 全ファビュラス数を取得
  const { data: fabulousRows } = await supabase
    .from("kobanashi_fabulous")
    .select("kobanashi_id, user_id")
    .in("kobanashi_id", ids);

  const countMap = new Map<string, number>();
  const userSet = new Set<string>();
  for (const row of fabulousRows ?? []) {
    countMap.set(row.kobanashi_id, (countMap.get(row.kobanashi_id) ?? 0) + 1);
    if (currentUserId && row.user_id === currentUserId) {
      userSet.add(row.kobanashi_id);
    }
  }

  return items.map((item) => ({
    ...item,
    fabulous_count: countMap.get(item.id) ?? 0,
    has_fabuloused: userSet.has(item.id),
  }));
}

export default async function Home() {
  const supabase = await createServerClient();

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // 今日の予定
  const { data: todayItems } = await supabase
    .from("kobanashi")
    .select("*")
    .eq("scheduled_date", today)
    .order("created_at", { ascending: true });

  // 最近の対応済み（直近5件）
  const { data: recentItems } = await supabase
    .from("kobanashi")
    .select("*")
    .eq("status", "対応済")
    .order("published_at", { ascending: false })
    .limit(5);

  // ダッシュボード全件（未対応のもの、日付順）
  const { data: allItems } = await supabase
    .from("kobanashi")
    .select("*")
    .eq("status", "未対応")
    .neq("scheduled_date", today)
    .order("scheduled_date", { ascending: true })
    .limit(20);

  // ファビュラスランキング（対応済みのファビュラス数トップ10）
  const { data: rankingItems } = await supabase
    .from("kobanashi")
    .select("*")
    .eq("status", "対応済")
    .order("published_at", { ascending: false })
    .limit(50);

  // 全ユーザー名を取得（profiles テーブルから）
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("display_name")
    .order("display_name");
  const allUserNames = (profileRows ?? []).map(
    (r: { display_name: string }) => r.display_name,
  );
  console.log("allUserNames:", allUserNames);

  // 現在のユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  // 今日のファシリテーターを取得
  const { data: facilitatorRow, error: facilitatorError } = await supabase
    .from("facilitator_schedule")
    .select("user_id")
    .eq("scheduled_date", today)
    .maybeSingle();

  if (facilitatorError) {
    console.error("[facilitator] query error:", facilitatorError.message);
  }

  const todayFacilitatorUserId = facilitatorRow?.user_id ?? null;

  // ファシリテーターの display_name を取得
  let todayFacilitatorName: string | null = null;
  if (todayFacilitatorUserId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", todayFacilitatorUserId)
      .maybeSingle();
    todayFacilitatorName = profile?.display_name ?? null;
  }

  const isFacilitator =
    todayFacilitatorUserId != null && currentUserId === todayFacilitatorUserId;

  // ファビュラス情報を付与
  const todayWithFab = await attachFabulous(
    supabase,
    (todayItems as Kobanashi[]) ?? [],
    currentUserId,
  );
  const recentWithFab = await attachFabulous(
    supabase,
    (recentItems as Kobanashi[]) ?? [],
    currentUserId,
  );

  // ランキング: ファビュラス付きで取得し、ファビュラス数でソート
  const rankingWithFab = await attachFabulous(
    supabase,
    (rankingItems as Kobanashi[]) ?? [],
    currentUserId,
  );
  const sortedRanking = rankingWithFab
    .filter((item) => item.fabulous_count > 0)
    .sort((a, b) => b.fabulous_count - a.fabulous_count)
    .slice(0, 10);

  return (
    <HomeStage
      todayItems={todayWithFab}
      recentItems={recentWithFab}
      allItems={(allItems as Kobanashi[]) ?? []}
      allUserNames={allUserNames}
      todayFacilitator={todayFacilitatorName}
      isFacilitator={isFacilitator}
      rankingItems={sortedRanking}
      currentUserId={currentUserId}
    />
  );
}
