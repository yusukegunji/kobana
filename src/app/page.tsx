import { createServerClient } from "@/lib/supabase/server";
import type { Kobanashi, KobanashiWithFabulous } from "@/lib/types";
import { todayInJST } from "@/lib/date";
import { timed } from "@/lib/timing";
import { HomeStage } from "./home-stage";

// ファビュラスは PostgREST の埋め込み取得でまとめて引く（リストごとの追加クエリを無くす）
const SELECT_WITH_FABULOUS = "*, kobanashi_fabulous(user_id)";

type KobanashiRow = Kobanashi & {
  kobanashi_fabulous?: { user_id: string }[] | null;
};

// 埋め込んだファビュラス行を、件数と自分が付けたかどうかに畳み込む
function withFabulous(
  rows: KobanashiRow[] | null,
  currentUserId: string | null,
): KobanashiWithFabulous[] {
  return (rows ?? []).map(({ kobanashi_fabulous, ...item }) => {
    const fabulous = kobanashi_fabulous ?? [];
    return {
      ...item,
      fabulous_count: fabulous.length,
      has_fabuloused:
        currentUserId != null &&
        fabulous.some((f) => f.user_id === currentUserId),
    };
  });
}

export default async function Home() {
  const supabase = await createServerClient();

  const today = todayInJST();

  // 互いに依存しないので必ず並列で投げる。直列にすると往復回数がそのまま TTFB に積み上がる
  const [
    todayRes,
    recentRes,
    stockRes,
    rankingRes,
    profilesRes,
    facilitatorRes,
    claimsRes,
  ] = await timed(
    "home.batch(7本の並列クエリ全体)",
    Promise.all([
      // 今日の予定
      timed(
        "home.today",
        supabase
          .from("kobanashi")
          .select(SELECT_WITH_FABULOUS)
          .eq("scheduled_date", today)
          .order("created_at", { ascending: true }),
      ),

      // 最近の対応済み（直近5件）
      timed(
        "home.recent",
        supabase
          .from("kobanashi")
          .select(SELECT_WITH_FABULOUS)
          .eq("status", "対応済")
          .order("published_at", { ascending: false })
          .limit(5),
      ),

      // ダッシュボード全件（未対応のもの、日付順）
      timed(
        "home.stock",
        supabase
          .from("kobanashi")
          .select("*")
          .eq("status", "未対応")
          .neq("scheduled_date", today)
          .order("scheduled_date", { ascending: true })
          .limit(20),
      ),

      // ファビュラスランキングの母集団（対応済みの直近50件）
      timed(
        "home.ranking",
        supabase
          .from("kobanashi")
          .select(SELECT_WITH_FABULOUS)
          .eq("status", "対応済")
          .order("published_at", { ascending: false })
          .limit(50),
      ),

      // 全ユーザー（名前一覧と、ファシリテーター名の引き当てに使う）
      timed(
        "home.profiles",
        supabase
          .from("profiles")
          .select("id, display_name")
          .order("display_name"),
      ),

      // 今日のファシリテーター
      timed(
        "home.facilitator",
        supabase
          .from("facilitator_schedule")
          .select("user_id")
          .eq("scheduled_date", today)
          .maybeSingle(),
      ),

      // getUser() と違い JWT をローカル検証するだけなので Auth API への往復が発生しない
      timed("home.claims", supabase.auth.getClaims()),
    ]),
  );

  if (facilitatorRes.error) {
    console.error("[facilitator] query error:", facilitatorRes.error.message);
  }

  const currentUserId = claimsRes.data?.claims.sub ?? null;

  const profileRows =
    (profilesRes.data as { id: string; display_name: string }[] | null) ?? [];
  const allUserNames = profileRows.map((r) => r.display_name);

  // ファシリテーター名は取得済みの profiles から引く（追加クエリを投げない）
  const todayFacilitatorUserId = facilitatorRes.data?.user_id ?? null;
  const todayFacilitatorName = todayFacilitatorUserId
    ? (profileRows.find((r) => r.id === todayFacilitatorUserId)?.display_name ??
      null)
    : null;

  const isFacilitator =
    todayFacilitatorUserId != null && currentUserId === todayFacilitatorUserId;

  // ランキング: ファビュラスが付いているものを多い順に上位10件
  const rankingItems = withFabulous(
    rankingRes.data as KobanashiRow[] | null,
    currentUserId,
  )
    .filter((item) => item.fabulous_count > 0)
    .sort((a, b) => b.fabulous_count - a.fabulous_count)
    .slice(0, 10);

  return (
    <HomeStage
      todayItems={withFabulous(
        todayRes.data as KobanashiRow[] | null,
        currentUserId,
      )}
      recentItems={withFabulous(
        recentRes.data as KobanashiRow[] | null,
        currentUserId,
      )}
      allItems={(stockRes.data as Kobanashi[] | null) ?? []}
      allUserNames={allUserNames}
      todayFacilitator={todayFacilitatorName}
      isFacilitator={isFacilitator}
      rankingItems={rankingItems}
      currentUserId={currentUserId}
    />
  );
}
