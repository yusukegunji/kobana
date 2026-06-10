"use client";

// 発表者が決まった後の共通アクション（STOCK 表示 / フリートーク開始 / やり直し）
// ダイス選出・指名のどちらからも使う

interface SpeakerActionsProps {
  speaker: string;
  hasStock: (name: string) => boolean;
  onShowStock: (name: string) => void;
  onFreeTalk: (name: string) => void;
  onReset: () => void;
  resetLabel?: string;
}

export function SpeakerActions({
  speaker,
  hasStock,
  onShowStock,
  onFreeTalk,
  onReset,
  resetLabel = "もう一度",
}: SpeakerActionsProps) {
  const stocked = hasStock(speaker);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div className="dice-caption" style={{ letterSpacing: 0 }}>
        {stocked
          ? `${speaker} さん、STOCK から披露する話を選んでください`
          : `${speaker} さんは STOCK がありません`}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {stocked ? (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => onShowStock(speaker)}
          >
            STOCK を表示
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => onFreeTalk(speaker)}
          >
            フリートークを開始
          </button>
        )}
        <button type="button" className="btn btn-sm" onClick={onReset}>
          {resetLabel}
        </button>
      </div>
    </div>
  );
}
