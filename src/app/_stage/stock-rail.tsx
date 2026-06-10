import Link from "next/link";
import type { Kobanashi } from "@/lib/types";
import { TypeTag, talkType } from "./stage-ui";

interface StockRailProps {
  items: Kobanashi[];
  selectedSpeaker: string | null;
  disabled: boolean;
  onPick: (item: Kobanashi) => void;
  onClearSpeaker: () => void;
}

export function StockRail({
  items,
  selectedSpeaker,
  disabled,
  onPick,
  onClearSpeaker,
}: StockRailProps) {
  return (
    <section className="block-stock">
      <div className="sec-head">
        <div className="eyebrow">
          <span className="dot" />
          {selectedSpeaker ? `${selectedSpeaker} の Stock` : "Stock"}
        </div>
        {selectedSpeaker ? (
          <span className="link" onClick={onClearSpeaker}>
            全員表示
          </span>
        ) : (
          <Link className="link" href="/kobanashi">
            すべて見る →
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="stock-empty">
          {selectedSpeaker
            ? `${selectedSpeaker} さんのストックがありません`
            : "ストックがありません"}
        </div>
      ) : (
        <div className="stock-list">
          {items.map((s) => (
            <button
              key={s.id}
              type="button"
              className="stock-item"
              disabled={disabled}
              onClick={() => onPick(s)}
            >
              <div className="si-top">
                <TypeTag type={talkType(s.title)} />
                <span className="pick">登壇に選ぶ →</span>
              </div>
              <div className="si-title">{s.title}</div>
              <div className="si-meta">
                <span className="who">{s.speaker}</span>
                {s.scheduled_date && <span>{s.scheduled_date}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
