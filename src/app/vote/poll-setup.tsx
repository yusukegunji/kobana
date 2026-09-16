"use client";

import { useState, useTransition } from "react";
import type { PollKind } from "@/lib/types";
import { createPoll } from "./actions";

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

interface PollSetupProps {
  kobanashiId: string | null;
  pushToast: (msg: string) => void;
  onStarted: () => void;
}

export function PollSetup({
  kobanashiId,
  pushToast,
  onStarted,
}: PollSetupProps) {
  const [kind, setKind] = useState<PollKind>("yesno");
  const [question, setQuestion] = useState("");
  const [draft, setDraft] = useState<DraftOption[]>(yesnoDraft);
  const [isPending, startTransition] = useTransition();

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
        : [
            ...o,
            { label: "", color: POLL_COLORS[o.length % POLL_COLORS.length] },
          ],
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
        onStarted();
        pushToast("📣 投票を開始しました — 聞き手の画面に表示中");
      }
    });
  }

  return (
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
                <button type="button" className="rm" onClick={() => rmOpt(i)}>
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
  );
}
