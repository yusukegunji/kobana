"use client";

import { useState } from "react";
import type { SeikaiMember } from "@/lib/types";
import { useRealtimeSeikai } from "@/lib/supabase/realtime-seikai";
import { AppBar } from "../../_stage/app-bar";
import { useToasts } from "../../_stage/use-toasts";
import { ThemeSetup } from "./theme-setup";
import { AnswerForm } from "./answer-form";
import { RevealBoard } from "./reveal-board";
import { ScoreBoard } from "./score-board";

interface SeikaiStageProps {
  members: SeikaiMember[];
  currentUserId: string | null;
  isHost: boolean;
  facilitatorName: string | null;
}

export function SeikaiStage({
  members,
  currentUserId,
  isHost,
  facilitatorName,
}: SeikaiStageProps) {
  const { game, answers, myAnswer, scores, loading } =
    useRealtimeSeikai(currentUserId);
  const [toasts, pushToast] = useToasts();

  // 公開済みの結果を見ている司会が「次のお題」を押して出題フォームを開いた状態
  const [showSetup, setShowSetup] = useState(false);

  // 誰かが新しいお題を出したら、開いていた出題フォームは閉じて全員同じ画面にする
  const [prevGameId, setPrevGameId] = useState(game?.id ?? null);
  if ((game?.id ?? null) !== prevGameId) {
    setPrevGameId(game?.id ?? null);
    setShowSetup(false);
  }

  function renderMain() {
    if (loading) {
      return (
        <div className="card seikai-panel">
          <div className="eyebrow">
            <span className="dot" />
            それ正解
          </div>
          <p className="seikai-note">読み込み中…</p>
        </div>
      );
    }
    // 回答受付中のゲームがあれば、それを最優先で全員に見せる
    if (game && game.status === "answering") {
      return (
        <AnswerForm
          game={game}
          myAnswer={myAnswer}
          members={members}
          isHost={isHost}
          facilitatorName={facilitatorName}
          pushToast={pushToast}
        />
      );
    }
    if (!game || showSetup) {
      return (
        <ThemeSetup
          isHost={isHost}
          facilitatorName={facilitatorName}
          pushToast={pushToast}
        />
      );
    }
    return (
      <RevealBoard
        game={game}
        answers={answers}
        isHost={isHost}
        currentUserId={currentUserId}
        onNextTheme={() => setShowSetup(true)}
        pushToast={pushToast}
      />
    );
  }

  return (
    <div className="koba-stage">
      <AppBar />

      <main className="stage-wrap">
        <div className="seikai-grid">
          <section className="seikai-main">{renderMain()}</section>
          <aside className="seikai-side">
            <ScoreBoard scores={scores} currentUserId={currentUserId} />
          </aside>
        </div>
      </main>

      <div className="koba-toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className="koba-toast">
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
