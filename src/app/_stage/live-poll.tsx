"use client";

import { useState, useTransition } from "react";
import type { PollKind } from "@/lib/types";
import { useRealtimePoll } from "@/lib/supabase/realtime";
import { createPoll, castVote, endPoll } from "../poll-action";
import { avatarColor } from "./stage-ui";

const POLL_COLORS = ["#ff9f1c", "#2ec27e", "#3aa0f0", "#9c84fb"];
const YESNO_COLORS = ["#2ec27e", "#ff6b5e"];

interface DraftOption {
  label: string;
  color: string;
}

interface Preset {
  key: string;
  label: string;
  q: string;
  kind: PollKind;
  opts: string[];
}

const PRESETS: Preset[] = [
  {
    key: "yesno",
    label: "はい / いいえ",
    q: "この話、明日の朝会で誰かに話したくなった？",
    kind: "yesno",
    opts: ["はい！", "いいえ"],
  },
  {
    key: "scale",
    label: "4段階で評価",
    q: "今の小噺、すべり具合を採点すると？",
    kind: "multi",
    opts: ["神回 🏆", "good 👍", "まあまあ 😌", "すべった 🛝"],
  },
  {
    key: "guess",
    label: "オチを予想",
    q: "この話のオチ、どうなると思う？",
    kind: "multi",
    opts: ["ハッピーエンド", "まさかの展開", "オチない"],
  },
];

function yesnoDraft(): DraftOption[] {
  return [
    { label: "はい！", color: YESNO_COLORS[0] },
    { label: "いいえ", color: YESNO_COLORS[1] },
  ];
}

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

  // setup フォーム用のローカル状態
  // showSetup: 結果表示中に「新しい投票」を押して作成フォームを開いた状態
  const [showSetup, setShowSetup] = useState(false);
  const [kind, setKind] = useState<PollKind>("yesno");
  const [question, setQuestion] = useState("");
  const [draft, setDraft] = useState<DraftOption[]>(yesnoDraft);
  const [optimisticVote, setOptimisticVote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // リアルタイムの自票が確定したら楽観的更新を解除（prop 変化時の state 調整パターン）
  const [prevMyVote, setPrevMyVote] = useState(myVote);
  if (myVote !== prevMyVote) {
    setPrevMyVote(myVote);
    setOptimisticVote(null);
  }

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

  /* ===================== SETUP ===================== */
  if (phase === "setup") {
    function applyPreset(p: Preset) {
      setKind(p.kind);
      setQuestion(p.q);
      const cols = p.kind === "yesno" ? YESNO_COLORS : POLL_COLORS;
      setDraft(p.opts.map((l, i) => ({ label: l, color: cols[i % cols.length] })));
    }
    function setKindToggle(k: PollKind) {
      setKind(k);
      if (k === "yesno") setDraft(yesnoDraft());
      else
        setDraft([
          { label: "", color: POLL_COLORS[0] },
          { label: "", color: POLL_COLORS[1] },
        ]);
    }
    function editOpt(i: number, label: string) {
      setDraft((o) => o.map((x, idx) => (idx === i ? { ...x, label } : x)));
    }
    function addOpt() {
      setDraft((o) =>
        o.length >= 4
          ? o
          : [...o, { label: "", color: POLL_COLORS[o.length % POLL_COLORS.length] }],
      );
    }
    function rmOpt(i: number) {
      setDraft((o) => (o.length <= 2 ? o : o.filter((_, idx) => idx !== i)));
    }
    function start() {
      const cleaned = draft
        .map((o) => ({ label: o.label.trim(), color: o.color }))
        .filter((o) => o.label.length > 0);
      if (!question.trim() || cleaned.length < 2) return;
      startTransition(async () => {
        const res = await createPoll({
          question,
          kind,
          options: cleaned,
          kobanashiId,
        });
        if (res.error) {
          pushToast("⚠️ " + res.error);
        } else {
          setShowSetup(false);
          pushToast("📣 投票を開始しました — 聞き手の画面に表示中");
        }
      });
    }

    return (
      <section className="block-poll">
        <div className="poll">
          <div className="poll-kicker">
            <span
              className="live-dot"
              style={{
                background: "var(--accent)",
                boxShadow: "0 0 10px var(--accent-glow)",
              }}
            />
            <span className="k-txt">Live Poll · 投票をつくる</span>
          </div>
          <p
            style={{
              margin: "0 0 18px",
              color: "var(--text-3)",
              fontSize: 13.5,
              lineHeight: 1.6,
            }}
          >
            発表中に聞き手全員へ投票を呼びかけられます。テンプレを選ぶか、自由に作成。
          </p>

          <div className="poll-setup">
            <div className="field">
              <label>クイックテンプレ</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => applyPreset(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>質問</label>
              <input
                className="input"
                value={question}
                placeholder="例：この話、今日イチで面白かった？"
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            <div className="field">
              <label>回答形式</label>
              <div className="type-toggle">
                <div
                  className={"tt" + (kind === "yesno" ? " on" : "")}
                  onClick={() => setKindToggle("yesno")}
                >
                  はい / いいえ
                </div>
                <div
                  className={"tt" + (kind === "multi" ? " on" : "")}
                  onClick={() => setKindToggle("multi")}
                >
                  選択肢（最大4つ）
                </div>
              </div>
            </div>

            <div className="field">
              <label>{kind === "yesno" ? "選択肢" : "選択肢を入力"}</label>
              {draft.map((o, i) => (
                <div key={i} className="opt-edit">
                  <span className="ix" style={{ background: o.color }}>
                    {i + 1}
                  </span>
                  <input
                    className="input"
                    value={o.label}
                    placeholder={`選択肢 ${i + 1}`}
                    disabled={kind === "yesno"}
                    onChange={(e) => editOpt(i, e.target.value)}
                  />
                  {kind === "multi" && draft.length > 2 && (
                    <button
                      type="button"
                      className="rm"
                      onClick={() => rmOpt(i)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {kind === "multi" && draft.length < 4 && (
                <button type="button" className="add-opt" onClick={addOpt}>
                  ＋ 選択肢を追加
                </button>
              )}
            </div>
          </div>

          <div className="poll-footer">
            <span className="poll-foot-note">🔒 1人1票（変更可）</span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={start}
              disabled={!question.trim() || isPending}
            >
              {isPending ? "開始中…" : "📣 投票を開始"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ===================== LIVE / ENDED ===================== */
  const isLive = phase === "live";
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
    if (!isLive || !poll) return;
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
    if (!poll) return;
    startTransition(async () => {
      const res = await endPoll(poll.id);
      if (res.error) pushToast("⚠️ " + res.error);
      else pushToast("⏱️ 投票を締め切りました");
    });
  }

  const winner = options.find((o) => leaders.includes(o.id));

  return (
    <section className="block-poll">
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
            <div className="poll-q">{poll?.question}</div>
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
              <span className="more">
                まだ投票はありません — 選択肢をタップ
              </span>
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
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setShowSetup(true);
                setKind("yesno");
                setQuestion("");
                setDraft(yesnoDraft());
              }}
            >
              ＋ 新しい投票
            </button>
          )}
        </div>

        {phase === "ended" && total > 0 && winner && (
          <div className="winner-banner">
            🏆 最多得票は <b>{winner.label}</b>（
            {Math.round((maxVotes / total) * 100)}%・{maxVotes}票）でした！
          </div>
        )}
        {phase === "ended" && total === 0 && (
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
    </section>
  );
}
