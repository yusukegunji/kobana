"use client";

import { useState, useTransition } from "react";
import type { Poll, PollOptionResult, PollVoter } from "@/lib/types";
import { avatarColor } from "../_stage/stage-ui";
import { castVote, endPoll } from "./actions";

interface PollResultProps {
  poll: Poll;
  options: PollOptionResult[];
  voters: PollVoter[];
  myVote: string | null;
  /** live なら投票を受け付ける。ended なら結果の閲覧のみ */
  isLive: boolean;
  audienceCount: number;
  currentUserId: string | null;
  pushToast: (msg: string) => void;
  onNewPoll: () => void;
}

export function PollResult({
  poll,
  options,
  voters,
  myVote,
  isLive,
  audienceCount,
  currentUserId,
  pushToast,
  onNewPoll,
}: PollResultProps) {
  const [optimisticVote, setOptimisticVote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // リアルタイムの自票が確定したら楽観的更新を解除（prop 変化時の state 調整パターン）
  const [prevMyVote, setPrevMyVote] = useState(myVote);
  if (myVote !== prevMyVote) {
    setPrevMyVote(myVote);
    setOptimisticVote(null);
  }

  const displayMyVote = optimisticVote ?? myVote;
  const total = options.reduce((s, o) => s + o.votes, 0);
  const maxVotes = Math.max(0, ...options.map((o) => o.votes));
  const leaders = options
    .filter((o) => o.votes === maxVotes && maxVotes > 0)
    .map((o) => o.id);
  const votedUserIds = new Set(voters.map((v) => v.userId));
  const optimisticExtra =
    optimisticVote && currentUserId && !votedUserIds.has(currentUserId) ? 1 : 0;
  const voterCount = voters.length + optimisticExtra;

  function vote(optionId: string) {
    if (!isLive) return;
    setOptimisticVote(optionId);
    startTransition(async () => {
      const res = await castVote(poll.id, optionId);
      if (res.error) {
        setOptimisticVote(null);
        pushToast("⚠️ " + res.error);
      } else {
        pushToast("🗳️ 投票しました");
      }
    });
  }

  function close() {
    startTransition(async () => {
      const res = await endPoll(poll.id);
      if (res.error) pushToast("⚠️ " + res.error);
      else pushToast("⏱️ 投票を締め切りました");
    });
  }

  const winner = options.find((o) => leaders.includes(o.id));

  return (
    <div className="poll">
      <div className="poll-head">
        <div className="ph-l">
          <div className="poll-kicker">
            {isLive ? (
              <>
                <span className="live-dot" />
                <span className="k-txt" style={{ color: "var(--live)" }}>
                  Live Poll · 投票受付中
                </span>
              </>
            ) : (
              <span className="k-txt">Live Poll · 結果</span>
            )}
          </div>
          <div className="poll-q">{poll.question}</div>
        </div>
        <div className="poll-meta">
          <span className="voters">
            🗳️ <b>{voterCount}</b> / {audienceCount}人
          </span>
        </div>
      </div>

      <div className="poll-opts">
        {options.map((o) => {
          const pct = total ? Math.round((o.votes / total) * 100) : 0;
          const lead = leaders.includes(o.id);
          const mine = displayMyVote === o.id;
          return (
            <button
              key={o.id}
              type="button"
              className={"opt" + (mine ? " voted" : "") + (lead ? " lead" : "")}
              style={
                {
                  "--opt-c": o.color,
                  cursor: isLive ? "pointer" : "default",
                } as React.CSSProperties
              }
              onClick={() => vote(o.id)}
              disabled={!isLive}
            >
              <span className="fill" style={{ width: pct + "%" }} />
              <span className="knob" style={{ background: o.color }}>
                {lead && total ? "★" : ""}
              </span>
              <span className="o-label">{o.label}</span>
              <span className="o-count">{o.votes}票</span>
              <span className="o-pct">{pct}%</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div className="presence">
          {voters.slice(-6).map((v, i) => (
            <span
              key={i}
              className="pa"
              style={{ background: avatarColor(v.name) }}
            >
              {v.name[0]}
            </span>
          ))}
          {voterCount > 0 ? (
            <span className="more">{voterCount}人が投票済み</span>
          ) : (
            <span className="more">まだ投票はありません — 選択肢をタップ</span>
          )}
        </div>
        {isLive ? (
          <button
            type="button"
            className="btn btn-sm"
            onClick={close}
            disabled={isPending}
          >
            ⏱️ 締め切る
          </button>
        ) : (
          <button type="button" className="btn btn-sm" onClick={onNewPoll}>
            ＋ 新しい投票
          </button>
        )}
      </div>

      {!isLive && total > 0 && winner && (
        <div className="winner-banner">
          🏆 最多得票は <b>{winner.label}</b>（
          {Math.round((maxVotes / total) * 100)}%・{maxVotes}票）でした！
        </div>
      )}
      {!isLive && total === 0 && (
        <div
          className="winner-banner"
          style={{
            borderColor: "var(--line-3)",
            background: "var(--surface)",
          }}
        >
          票が集まりませんでした。次の投票でリベンジ！
        </div>
      )}
    </div>
  );
}
