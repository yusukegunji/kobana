"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SpeakerActions } from "./speaker-actions";

// 回転中の角速度（deg/frame）とストップ時の減速率
const SPIN_VELOCITY = 14;
const FRICTION = 0.985;
const STOP_VELOCITY = 0.2;

type Phase = "idle" | "spinning" | "stopping" | "done";

interface StageDiceProps {
  names: string[];
  facilitator: string | null;
  canRoll: boolean;
  hasStock: (name: string) => boolean;
  onShowStock: (name: string) => void;
  onFreeTalk: (name: string) => void;
  onRolled: (name: string) => void;
}

// 正規化した回転角（0〜360）から、ポインタ（真上）が指すセグメントの index を求める
function winnerIndex(rotation: number, count: number): number {
  if (count === 0) return 0;
  const seg = 360 / count;
  const at = (((-rotation % 360) + 360) % 360) / seg;
  return Math.floor(at) % count;
}

export function StageDice({
  names,
  facilitator,
  canRoll,
  hasStock,
  onShowStock,
  onFreeTalk,
  onRolled,
}: StageDiceProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [rot, setRot] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const rotRef = useRef(0);
  const velRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<() => void>(() => {});

  const count = names.length;
  const seg = count > 0 ? 360 / count : 360;

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  const tick = useCallback(() => {
    rotRef.current += velRef.current;

    if (phaseRef.current === "stopping") {
      velRef.current *= FRICTION;
      if (velRef.current <= STOP_VELOCITY) {
        // 着地：ポインタが指すセグメントが当選者
        const pick = names[winnerIndex(rotRef.current, names.length)];
        setRot(rotRef.current);
        velRef.current = 0;
        stopLoop();
        setResult(pick);
        setPhaseBoth("done");
        if (pick) onRolled(pick);
        return;
      }
    }

    setRot(rotRef.current);
    rafRef.current = requestAnimationFrame(() => tickRef.current());
  }, [names, onRolled, setPhaseBoth, stopLoop]);

  // 最新の tick を ref に保持し、自己参照（宣言前アクセス）を避ける
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const spin = useCallback(() => {
    if (phaseRef.current !== "idle" || count === 0) return;
    setResult(null);
    velRef.current = SPIN_VELOCITY;
    setPhaseBoth("spinning");
    stopLoop();
    rafRef.current = requestAnimationFrame(() => tickRef.current());
  }, [count, setPhaseBoth, stopLoop]);

  // クリックで目押しストップ
  const stop = useCallback(() => {
    if (phaseRef.current !== "spinning") return;
    setPhaseBoth("stopping");
  }, [setPhaseBoth]);

  const reset = useCallback(() => {
    stopLoop();
    velRef.current = 0;
    setResult(null);
    setPhaseBoth("idle");
  }, [setPhaseBoth, stopLoop]);

  // セグメントの色（アクセントと暗色を交互に）
  const stops = names
    .map((_, i) => {
      const a = (i * seg).toFixed(3);
      const b = ((i + 1) * seg).toFixed(3);
      const color =
        i % 2 === 0
          ? "var(--surface-hi)"
          : "color-mix(in srgb, var(--accent) 22%, var(--surface-2))";
      return `${color} ${a}deg ${b}deg`;
    })
    .join(", ");
  const wheelBg =
    count > 0
      ? `conic-gradient(from 0deg, ${stops})`
      : "var(--surface-2)";

  const isSpinning = phase === "spinning" || phase === "stopping";

  return (
    <div className="dice-zone">
      <button
        type="button"
        className="roulette-scene"
        onClick={phase === "spinning" ? stop : undefined}
        disabled={!canRoll || !isSpinning}
        aria-label={phase === "spinning" ? "ルーレットを止める" : "ルーレット"}
      >
        <span className="roulette-pointer" />
        <span
          className="roulette-wheel"
          style={{ background: wheelBg, transform: `rotate(${rot}deg)` }}
        >
          {names.map((name, i) => (
            <span
              key={name}
              className="roulette-label"
              style={{ transform: `rotate(${i * seg + seg / 2}deg)` }}
            >
              <span
                className={
                  "roulette-name" +
                  (result === name ? " roulette-name--won" : "")
                }
              >
                {name}
              </span>
            </span>
          ))}
        </span>
        <span className="roulette-hub" />
      </button>

      <div className="dice-caption">
        本日のファシリテーター
        <b>{facilitator ?? "未設定"}</b>
      </div>

      {/* 全メンバーをピルで表示し、選ばれた人をハイライト */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          maxWidth: 320,
        }}
      >
        {names.map((name) => {
          const won = result === name;
          return (
            <span
              key={name}
              className="tag"
              style={
                won
                  ? {
                      background: "var(--accent)",
                      color: "#1a1206",
                      borderColor: "transparent",
                      fontWeight: 800,
                    }
                  : undefined
              }
            >
              {name}
            </span>
          );
        })}
      </div>

      {canRoll ? (
        phase === "done" && result ? (
          <SpeakerActions
            speaker={result}
            hasStock={hasStock}
            onShowStock={onShowStock}
            onFreeTalk={onFreeTalk}
            onReset={reset}
          />
        ) : phase === "spinning" ? (
          <button type="button" className="btn btn-sm btn-primary" onClick={stop}>
            🎯 ストップ（目押し）
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-sm"
            onClick={spin}
            disabled={phase === "stopping" || count === 0}
          >
            🎡 {phase === "stopping" ? "停止中…" : "ルーレットを回す"}
          </button>
        )
      ) : (
        <div className="dice-caption" style={{ letterSpacing: 0, maxWidth: 280 }}>
          {facilitator
            ? `ルーレットを回せるのは ${facilitator} さんだけです`
            : "本日のファシリテーターが未設定です"}
        </div>
      )}
    </div>
  );
}
