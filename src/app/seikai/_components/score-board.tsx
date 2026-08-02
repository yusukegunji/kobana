"use client";

import type { SeikaiScore } from "@/lib/types";
import { avatarColor } from "../../_stage/stage-ui";

const MEDAL_CLASSES = ["m1", "m2", "m3"];

interface ScoreBoardProps {
  scores: SeikaiScore[];
  currentUserId: string | null;
}

export function ScoreBoard({ scores, currentUserId }: ScoreBoardProps) {
  return (
    <div className="card seikai-panel">
      <div className="eyebrow">
        <span className="dot" />
        今日の正解数
      </div>

      {scores.length === 0 ? (
        <p className="seikai-note">
          まだ正解が出ていません。今日いちばん「それ正解」を取るのは誰？
        </p>
      ) : (
        <div className="rank-list">
          {scores.map((score, i) => (
            <div
              key={score.userId}
              className={"rank-item" + (i === 0 ? " top" : "")}
            >
              <span className={"medal " + (MEDAL_CLASSES[i] ?? "mn")}>
                {i + 1}
              </span>
              <span
                className="seikai-av"
                style={{ background: avatarColor(score.name) }}
              >
                {(score.name || "?")[0]}
              </span>
              <div className="rank-mid">
                <div className="rank-title">
                  {score.name}
                  {score.userId === currentUserId && (
                    <span className="seikai-you">あなた</span>
                  )}
                </div>
              </div>
              <span className="rank-score">◎ {score.correctCount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
