"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import type { Kobanashi, KobanashiWithFabulous } from "@/lib/types";
import { finishOnAir } from "../kobanashi/_components/onair-action";
import { FabulousButton } from "../kobanashi/_components/fabulous-button";
import { Avatar, TypeTag, talkType } from "./stage-ui";
import { StageDice } from "./stage-dice";

function formatTime(seconds: number): { mm: string; ss: string } {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return { mm, ss };
}

interface OnAirHeroProps {
  item: KobanashiWithFabulous;
  facilitator: string | null;
  currentUserId: string | null;
  startedAt: string | undefined;
}

export function OnAirHero({
  item,
  facilitator,
  currentUserId,
  startedAt,
}: OnAirHeroProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isPending, startTransition] = useTransition();
  // 開始時刻（ms）。レンダー中に Date.now() を呼ばないよう effect で初期化する
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = startedAt
      ? new Date(startedAt).getTime()
      : Date.now();
  }, [startedAt]);

  useEffect(() => {
    const iv = setInterval(() => {
      if (startTime.current != null) {
        setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const handleFinish = useCallback(() => {
    const base = startTime.current ?? Date.now();
    const finalSeconds = Math.floor((Date.now() - base) / 1000);
    startTransition(async () => {
      await finishOnAir(item.id, finalSeconds);
    });
  }, [item.id]);

  const { mm, ss } = formatTime(elapsed);

  return (
    <div className="hero">
      <div className="spotbeam" />
      <div className="hero-grid">
        <div className="hero-main">
          <div className="now">
            <span className="badge-live">
              <span className="pip" />
              ON AIR
            </span>
            <span className="now-label">Today&apos;s Speaker</span>
          </div>
          <div className="who-row">
            <Avatar name={item.speaker} size={66} radius={18} />
            <div>
              <span className="who-name">
                ただいま発表中
                <b>{item.speaker}</b>
              </span>
            </div>
          </div>
          <h1 className="talk-title">{item.title}</h1>
          <div className="talk-sub">
            <TypeTag type={talkType(item.title)} />
            {facilitator && (
              <span className="facil">
                ファシリテーター <b>{facilitator}</b>
              </span>
            )}
            <span className="timer">
              <span className="t-num">
                {mm}:{ss}
              </span>
              <span className="t-lab">ELAPSED</span>
            </span>
          </div>
          <div className="hero-actions">
            <FabulousButton
              kobanashiId={item.id}
              initialCount={item.fabulous_count}
              initialFabuloused={item.has_fabuloused}
              currentUserId={currentUserId}
              size="lg"
            />
            <button
              type="button"
              className="btn"
              onClick={handleFinish}
              disabled={isPending}
            >
              {isPending ? "保存中…" : "⏹ 発表を終了"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SelectHeroProps {
  names: string[];
  facilitator: string | null;
  canRoll: boolean;
  hasStock: (name: string) => boolean;
  onShowStock: (name: string) => void;
  onFreeTalk: (name: string) => void;
  onRolled: (name: string) => void;
}

export function SelectHero({
  names,
  facilitator,
  canRoll,
  hasStock,
  onShowStock,
  onFreeTalk,
  onRolled,
}: SelectHeroProps) {
  return (
    <div className="hero">
      <div className="spotbeam" />
      <div className="hero-grid">
        <div className="hero-main">
          <div className="now">
            <span className="now-label">Today&apos;s Speaker</span>
          </div>
          <h1 className="talk-title">
            {canRoll ? "次の発表者をダイスで選出" : "発表者の選出を待っています"}
          </h1>
          <div className="talk-sub">
            ダイスで本日の登壇者を決め、STOCK から小噺を選ぶか、フリートークを始めましょう。
          </div>
        </div>
        <StageDice
          names={names}
          facilitator={facilitator}
          canRoll={canRoll}
          hasStock={hasStock}
          onShowStock={onShowStock}
          onFreeTalk={onFreeTalk}
          onRolled={onRolled}
        />
      </div>
    </div>
  );
}

// 待機中・公開済みの一覧（発表中に下へ表示）
interface TalkListProps {
  waiting: KobanashiWithFabulous[];
  done: KobanashiWithFabulous[];
  onStart: (item: Kobanashi) => void;
  startDisabled: boolean;
  currentUserId: string | null;
}

export function TalkList({
  waiting,
  done,
  onStart,
  startDisabled,
  currentUserId,
}: TalkListProps) {
  if (waiting.length === 0 && done.length === 0) return null;
  return (
    <div className="hl-list" style={{ marginTop: 18 }}>
      {waiting.map((item) => (
        <div key={item.id} className="hl-item">
          <Avatar name={item.speaker} size={36} radius={11} />
          <div className="hl-mid">
            <div className="hl-title">{item.title}</div>
            <div className="hl-meta">
              <span className="hl-who">{item.speaker}</span>
              <span>待機中</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => onStart(item)}
            disabled={startDisabled}
          >
            On Air
          </button>
        </div>
      ))}
      {done.map((item) => (
        <div key={item.id} className="hl-item" style={{ opacity: 0.7 }}>
          <Avatar name={item.speaker} size={36} radius={11} />
          <div className="hl-mid">
            <div className="hl-title" style={{ textDecoration: "line-through" }}>
              {item.title}
            </div>
            <div className="hl-meta">
              <span className="hl-who">{item.speaker}</span>
              <span>発表済み</span>
            </div>
          </div>
          <FabulousButton
            kobanashiId={item.id}
            initialCount={item.fabulous_count}
            initialFabuloused={item.has_fabuloused}
            currentUserId={currentUserId}
          />
        </div>
      ))}
    </div>
  );
}
