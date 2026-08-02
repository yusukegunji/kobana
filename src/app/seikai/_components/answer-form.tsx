"use client";

import { useState, useTransition } from "react";
import type { SeikaiAnswerView, SeikaiGame, SeikaiMember } from "@/lib/types";
import { avatarColor } from "../../_stage/stage-ui";
import { revealAnswers, submitAnswer } from "../actions";

interface AnswerFormProps {
  game: SeikaiGame;
  myAnswer: SeikaiAnswerView | null;
  members: SeikaiMember[];
  isHost: boolean;
  facilitatorName: string | null;
  pushToast: (msg: string) => void;
}

export function AnswerForm({
  game,
  myAnswer,
  members,
  isHost,
  facilitatorName,
  pushToast,
}: AnswerFormProps) {
  const [draft, setDraft] = useState(myAnswer?.body ?? "");
  const [editing, setEditing] = useState(myAnswer === null);
  const [isPending, startTransition] = useTransition();

  // リアルタイムで自分の回答が確定したら入力欄を確定表示に切り替える
  // （prop 変化時の state 調整パターン）
  const [prevBody, setPrevBody] = useState(myAnswer?.body ?? null);
  const currentBody = myAnswer?.body ?? null;
  if (currentBody !== prevBody) {
    setPrevBody(currentBody);
    setDraft(currentBody ?? "");
    setEditing(currentBody === null);
  }

  const answeredIds = new Set(game.answered_user_ids);
  const answered = members.filter((m) => answeredIds.has(m.id));

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await submitAnswer(game.id, trimmed);
      if (res.error) {
        pushToast("⚠️ " + res.error);
        return;
      }
      setEditing(false);
      pushToast("✍️ 回答しました");
    });
  }

  function reveal() {
    startTransition(async () => {
      const res = await revealAnswers(game.id);
      if (res.error) pushToast("⚠️ " + res.error);
      else pushToast("🎉 回答を公開しました");
    });
  }

  return (
    <div className="card seikai-panel">
      <div className="eyebrow">
        <span className="live-dot" />
        <span style={{ color: "var(--live)" }}>それ正解 · 回答受付中</span>
      </div>

      <div className="seikai-theme">{game.theme}</div>

      <div className="field seikai-field">
        <label htmlFor="seikai-answer">あなたの回答</label>
        {editing ? (
          <div className="seikai-answer-row">
            <input
              id="seikai-answer"
              className="input"
              value={draft}
              maxLength={60}
              placeholder="思いついたものをひとつ"
              autoComplete="off"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={submit}
              disabled={!draft.trim() || isPending}
            >
              {isPending ? "送信中…" : "回答する"}
            </button>
          </div>
        ) : (
          <div className="seikai-answer-row">
            <div className="seikai-locked">
              <span className="seikai-locked-mark">✍️</span>
              <span className="seikai-locked-body">{myAnswer?.body}</span>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setEditing(true)}
            >
              書き直す
            </button>
          </div>
        )}
        <p className="seikai-hint">
          🔒 締め切るまで、あなたの回答は他の人には見えません
        </p>
      </div>

      <div className="seikai-footer">
        <div className="presence">
          {answered.slice(-8).map((m) => (
            <span
              key={m.id}
              className="pa"
              style={{ background: avatarColor(m.display_name) }}
              title={m.display_name}
            >
              {(m.display_name || "?")[0]}
            </span>
          ))}
          <span className="more">
            {answered.length > 0
              ? `${answered.length} / ${members.length}人が回答済み`
              : "まだ回答はありません"}
          </span>
        </div>

        {isHost ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={reveal}
            disabled={isPending}
          >
            ⏱️ 締め切って公開
          </button>
        ) : (
          <span className="seikai-hint">
            {facilitatorName ?? "司会"} さんが締め切ると一斉公開されます
          </span>
        )}
      </div>
    </div>
  );
}
