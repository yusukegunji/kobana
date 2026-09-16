"use client";

import { useState } from "react";
import { useRealtimePoll } from "@/lib/supabase/realtime";
import { PollSetup } from "./poll-setup";
import { PollResult } from "./poll-result";

interface LivePollProps {
  currentUserId: string | null;
  audienceCount: number;
  kobanashiId: string | null;
  pushToast: (msg: string) => void;
}

export function LivePoll({
  currentUserId,
  audienceCount,
  kobanashiId,
  pushToast,
}: LivePollProps) {
  const { poll, options, voters, myVote, loading } =
    useRealtimePoll(currentUserId);

  // showSetup: 結果表示中に「新しい投票」を押して作成フォームを開いた状態
  const [showSetup, setShowSetup] = useState(false);

  if (loading) {
    return (
      <section className="block-poll">
        <div className="poll">
          <div className="poll-kicker">
            <span className="live-dot" style={{ background: "var(--accent)" }} />
            <span className="k-txt">Live Poll</span>
          </div>
          <p style={{ color: "var(--text-3)", fontSize: 13.5 }}>読み込み中…</p>
        </div>
      </section>
    );
  }

  // live 投票が存在すれば常にそれを最優先で表示する（誰かが開始したら全員に見せる）
  const phase: "setup" | "live" | "ended" =
    poll && poll.status === "live"
      ? "live"
      : !poll || showSetup
        ? "setup"
        : "ended";

  return (
    <section className="block-poll">
      {phase === "setup" || !poll ? (
        <PollSetup
          kobanashiId={kobanashiId}
          pushToast={pushToast}
          onStarted={() => setShowSetup(false)}
        />
      ) : (
        <PollResult
          poll={poll}
          options={options}
          voters={voters}
          myVote={myVote}
          isLive={phase === "live"}
          audienceCount={audienceCount}
          currentUserId={currentUserId}
          pushToast={pushToast}
          onNewPoll={() => setShowSetup(true)}
        />
      )}
    </section>
  );
}
