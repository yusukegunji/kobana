"use client";

import { useState, useTransition } from "react";
import type { SeikaiAnswerView, SeikaiGame } from "@/lib/types";
import { avatarColor } from "../../_stage/stage-ui";
import { setAnswerCorrect } from "../actions";

interface RevealBoardProps {
  game: SeikaiGame;
  answers: SeikaiAnswerView[];
  isHost: boolean;
  currentUserId: string | null;
  onNextTheme: () => void;
  pushToast: (msg: string) => void;
}

export function RevealBoard({
  game,
  answers,
  isHost,
  currentUserId,
  onNextTheme,
  pushToast,
}: RevealBoardProps) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  // リアルタイムで正解マークが確定したら楽観的更新を捨てる
  const signature = answers.map((a) => `${a.id}:${+a.is_correct}`).join(",");
  const [prevSignature, setPrevSignature] = useState(signature);
  if (signature !== prevSignature) {
    setPrevSignature(signature);
    setOptimistic({});
  }

  const isCorrect = (answer: SeikaiAnswerView) =>
    optimistic[answer.id] ?? answer.is_correct;
  const winners = answers.filter(isCorrect);

  function toggle(answer: SeikaiAnswerView) {
    const next = !isCorrect(answer);
    setOptimistic((prev) => ({ ...prev, [answer.id]: next }));
    startTransition(async () => {
      const res = await setAnswerCorrect(game.id, answer.id, next);
      if (!res.error) return;
      setOptimistic((prev) => {
        const rollback = { ...prev };
        delete rollback[answer.id];
        return rollback;
      });
      pushToast("⚠️ " + res.error);
    });
  }

  return (
    <div className="card seikai-panel">
      <div className="eyebrow">
        <span className="dot" />
        それ正解 · 結果発表
      </div>

      <div className="seikai-theme">{game.theme}</div>

      {answers.length === 0 ? (
        <p className="seikai-note">回答が集まりませんでした。</p>
      ) : (
        <>
          <p className="seikai-hint">
            {isHost
              ? "正解だと思う回答をタップしてください（何枚でも選べます）"
              : "司会が正解を選びます"}
          </p>

          <div className="ans-grid">
            {answers.map((answer) => {
              const correct = isCorrect(answer);
              return (
                <button
                  key={answer.id}
                  type="button"
                  className={
                    "ans-card" +
                    (correct ? " correct" : "") +
                    (answer.user_id === currentUserId ? " mine" : "")
                  }
                  onClick={() => toggle(answer)}
                  disabled={!isHost || isPending}
                >
                  <span className="ans-mark">{correct ? "◎" : ""}</span>
                  <span className="ans-body">{answer.body}</span>
                  <span className="ans-who">
                    <span
                      className="seikai-av"
                      style={{ background: avatarColor(answer.name) }}
                    >
                      {(answer.name || "?")[0]}
                    </span>
                    {answer.name}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {winners.length > 0 && (
        <div className="winner-banner">
          🎉 それ正解！ <b>{winners.map((w) => w.name).join("・")}</b>{" "}
          さん（{winners.length}人）
        </div>
      )}

      <div className="seikai-footer">
        <span className="seikai-hint">
          回答 {answers.length}件 · 正解 {winners.length}件
        </span>
        {isHost && (
          <button type="button" className="btn btn-primary" onClick={onNextTheme}>
            ＋ 次のお題へ
          </button>
        )}
      </div>
    </div>
  );
}
