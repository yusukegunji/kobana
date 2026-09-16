import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { todayInJST } from "@/lib/date";
import { MEMBER_SELECT, filterSpeakerCandidates } from "@/lib/member-status";
import type { MemberRow } from "@/lib/types";
import { SeikaiStage } from "./_components/seikai-stage";

export const metadata: Metadata = {
  title: "それ正解 - Kobana",
  description: "朝会でみんなでやる、お題一斉回答ゲーム",
};

export default async function SeikaiPage() {
  const supabase = await createServerClient();

  const today = todayInJST();

  // 互いに依存しないので並列で投げる（往復回数がそのまま TTFB に積み上がる）
  const [userRes, profilesRes, facilitatorRes] = await Promise.all([
    supabase.auth.getUser(),

    // 全メンバー（退職者を含む）。ファシリテーター名の引き当てに使う
    supabase
      .from("profiles")
      .select(MEMBER_SELECT)
      .order("display_name", { ascending: true }),

    supabase
      .from("facilitator_schedule")
      .select("user_id")
      .eq("scheduled_date", today)
      .maybeSingle(),
  ]);

  const currentUserId = userRes.data.user?.id ?? null;

  const allMembers = (profilesRes.data as MemberRow[] | null) ?? [];
  // 回答母数は発表者候補に揃える（発表者候補から外れた人は朝会に参加しない扱い）
  const members = filterSpeakerCandidates(allMembers, today);

  const facilitatorId = facilitatorRes.data?.user_id ?? null;
  const facilitatorName =
    allMembers.find((m) => m.id === facilitatorId)?.display_name ?? null;

  // 担当未設定の日は誰も司会できなくなるため全員に許可する
  // （actions.ts の verifyHost と同じ規則。ここでの判定は表示制御のみ）
  const isHost = facilitatorId === null || facilitatorId === currentUserId;

  return (
    <SeikaiStage
      members={members}
      currentUserId={currentUserId}
      isHost={isHost}
      facilitatorName={facilitatorName}
    />
  );
}
