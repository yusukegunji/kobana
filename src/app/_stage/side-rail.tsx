import type { KobanashiWithFabulous } from "@/lib/types";
import { FabulousButton } from "../kobanashi/_components/fabulous-button";
import { Avatar } from "./stage-ui";

const MEDALS = ["🥇", "🥈", "🥉"];

interface SideRailProps {
  highlights: KobanashiWithFabulous[];
  ranking: KobanashiWithFabulous[];
  currentUserId: string | null;
}

export function SideRail({ highlights, ranking, currentUserId }: SideRailProps) {
  return (
    <section className="block-rail">
      {highlights.length > 0 && (
        <div>
          <div className="sec-head">
            <div className="eyebrow">
              <span className="dot" />
              Recent Highlights
            </div>
          </div>
          <div className="hl-list">
            {highlights.map((h) => (
              <div key={h.id} className="hl-item">
                <Avatar name={h.speaker} size={36} radius={11} />
                <div className="hl-mid">
                  <div className="hl-title">{h.title}</div>
                  <div className="hl-meta">
                    <span className="hl-who">{h.speaker}</span>
                    {h.duration != null && <span>{h.duration}分</span>}
                  </div>
                </div>
                <FabulousButton
                  kobanashiId={h.id}
                  initialCount={h.fabulous_count}
                  initialFabuloused={h.has_fabuloused}
                  currentUserId={currentUserId}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {ranking.length > 0 && (
        <div>
          <div className="sec-head">
            <div className="eyebrow">
              <span className="dot" />
              Fabulous Ranking
            </div>
          </div>
          <div className="rank-list">
            {ranking.map((r, i) => (
              <div key={r.id} className={"rank-item" + (i === 0 ? " top" : "")}>
                <span
                  className={
                    "medal " +
                    (i === 0 ? "m1" : i === 1 ? "m2" : i === 2 ? "m3" : "mn")
                  }
                >
                  {i < 3 ? MEDALS[i] : i + 1}
                </span>
                <div className="rank-mid">
                  <div className="rank-title">{r.title}</div>
                  <div className="rank-who">{r.speaker}</div>
                </div>
                <span className="rank-score">❤ {r.fabulous_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
