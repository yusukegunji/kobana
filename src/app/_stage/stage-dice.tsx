"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// 面のインデックス → その面を正面に向ける回転（デザインの faceRot を移植）
const FACE_ROT = [
  { x: 0, y: 0 },
  { x: 0, y: -90 },
  { x: 0, y: -180 },
  { x: 0, y: 90 },
  { x: -90, y: 0 },
  { x: 90, y: 0 },
];

const ROLL_MS = 2150;

interface StageDiceProps {
  names: string[];
  facilitator: string | null;
  canRoll: boolean;
  hasStock: (name: string) => boolean;
  onShowStock: (name: string) => void;
  onFreeTalk: (name: string) => void;
  onRolled: (name: string) => void;
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
  const faces = names.slice(0, 6);
  const [rolling, setRolling] = useState(false);
  const [rot, setRot] = useState({ x: -18, y: 24 });
  const [result, setResult] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const roll = useCallback(() => {
    if (rolling || names.length === 0) return;
    setRolling(true);
    setResult(null);

    // 抽選は全メンバーから公平に行う（キューブは演出）
    const pick = Math.floor(Math.random() * names.length);
    const base = FACE_ROT[pick % FACE_ROT.length];
    const spins = 2 + Math.floor(Math.random() * 2);
    setRot({ x: base.x - 360 * spins, y: base.y - 360 * spins });

    timeoutRef.current = setTimeout(() => {
      setRolling(false);
      setResult(names[pick]);
      onRolled(names[pick]);
    }, ROLL_MS);
  }, [rolling, names, onRolled]);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return (
    <div className="dice-zone">
      <div className="dice-scene">
        <div
          className="dice"
          style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
        >
          {faces.map((m, i) => (
            <div key={i} className={"dice-face df" + (i + 1)}>
              <span className="pips">{i + 1}</span>
              <span className="nm">{m}</span>
            </div>
          ))}
        </div>
      </div>

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
        result ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div className="dice-caption" style={{ letterSpacing: 0 }}>
              {hasStock(result)
                ? `${result} さん、STOCK から披露する話を選んでください`
                : `${result} さんは STOCK がありません`}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {hasStock(result) ? (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => onShowStock(result)}
                >
                  STOCK を表示
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => onFreeTalk(result)}
                >
                  フリートークを開始
                </button>
              )}
              <button type="button" className="btn btn-sm" onClick={reset}>
                もう一度
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-sm"
            onClick={roll}
            disabled={rolling || names.length === 0}
          >
            🎲 {rolling ? "回転中…" : "ダイスを振る"}
          </button>
        )
      ) : (
        <div className="dice-caption" style={{ letterSpacing: 0, maxWidth: 280 }}>
          {facilitator
            ? `ダイスを振れるのは ${facilitator} さんだけです`
            : "本日のファシリテーターが未設定です"}
        </div>
      )}
    </div>
  );
}
