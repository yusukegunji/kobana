"use client";

import { useState, useCallback } from "react";
import { SpeakerActions } from "./speaker-actions";

interface StageNominateProps {
  names: string[];
  facilitator: string | null;
  canNominate: boolean;
  hasStock: (name: string) => boolean;
  onShowStock: (name: string) => void;
  onFreeTalk: (name: string) => void;
  onNominated: (name: string) => void;
}

export function StageNominate({
  names,
  facilitator,
  canNominate,
  hasStock,
  onShowStock,
  onFreeTalk,
  onNominated,
}: StageNominateProps) {
  const [picked, setPicked] = useState<string | null>(null);

  const nominate = useCallback(
    (name: string) => {
      setPicked(name);
      onNominated(name);
    },
    [onNominated],
  );

  const reset = useCallback(() => {
    setPicked(null);
  }, []);

  return (
    <div className="dice-zone">
      <div className="dice-caption">
        本日のファシリテーター
        <b>{facilitator ?? "未設定"}</b>
      </div>

      {canNominate ? (
        picked ? (
          <SpeakerActions
            speaker={picked}
            hasStock={hasStock}
            onShowStock={onShowStock}
            onFreeTalk={onFreeTalk}
            onReset={reset}
            resetLabel="選び直す"
          />
        ) : (
          <>
            <div
              className="dice-caption"
              style={{ letterSpacing: 0, maxWidth: 280 }}
            >
              発表してもらう人を選んでください
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
                maxWidth: 320,
              }}
            >
              {names.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="tag"
                  style={{ cursor: "pointer" }}
                  onClick={() => nominate(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </>
        )
      ) : (
        <div className="dice-caption" style={{ letterSpacing: 0, maxWidth: 280 }}>
          {facilitator
            ? `指名できるのは ${facilitator} さんだけです`
            : "本日のファシリテーターが未設定です"}
        </div>
      )}
    </div>
  );
}
