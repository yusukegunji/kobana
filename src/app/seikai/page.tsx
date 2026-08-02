import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { todayInJST } from "@/lib/date";
import type { SeikaiMember } from "@/lib/types";
import { SeikaiStage } from "./_components/seikai-stage";

export const metadata: Metadata = {
  title: "それ正解 - Kobana",
  description: "朝会でみんなでやる、お題一斉回答ゲーム",
};

export default async function SeikaiPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("display_name", { ascending: true });
  const members = (profiles as SeikaiMember[]) ?? [];

  const { data: facilitatorRow } = await supabase
    .from("facilitator_schedule")
    .select("user_id")
    .eq("scheduled_date", todayInJST())
    .maybeSingle();
  const facilitatorId = facilitatorRow?.user_id ?? null;
  const facilitatorName =
    members.find((m) => m.id === facilitatorId)?.display_name ?? null;

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
