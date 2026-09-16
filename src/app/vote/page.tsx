import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { todayInJST } from "@/lib/date";
import { MEMBER_SELECT, filterSpeakerCandidates } from "@/lib/member-status";
import type { MemberRow } from "@/lib/types";
import { VoteStage } from "./vote-stage";

export const metadata: Metadata = {
  title: "投票 - Kobana",
  description: "発表中の小噺に、聞き手全員でその場で投票する",
};

export default async function VotePage() {
  const supabase = await createServerClient();

  const today = todayInJST();

  // 互いに依存しないので並列で投げる（往復回数がそのまま TTFB に積み上がる）
  const [profilesRes, claimsRes] = await Promise.all([
    supabase.from("profiles").select(MEMBER_SELECT).order("display_name"),
    // getUser() と違い JWT をローカル検証するだけなので Auth API への往復が発生しない
    supabase.auth.getClaims(),
  ]);

  // 母数はホームのルーレット候補と揃える（発表者候補から外れた人は朝会に参加しない扱い）
  const audienceCount = filterSpeakerCandidates(
    (profilesRes.data as MemberRow[] | null) ?? [],
    today,
  ).length;

  return (
    <VoteStage
      currentUserId={claimsRes.data?.claims.sub ?? null}
      audienceCount={audienceCount}
    />
  );
}
