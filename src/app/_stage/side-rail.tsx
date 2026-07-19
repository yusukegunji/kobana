import type { KobanashiWithFabulous } from "@/lib/types";
import { FabulousButton } from "../kobanashi/_components/fabulous-button";
import { Avatar } from "./stage-ui";

const MEDALS = ["🥇", "🥈", "🥉"];

const PROJECT_BOARDS = [
  {
    label: "truss all",
    desc: "全体の進捗ボード",
    href: "https://github.com/orgs/truss-company/projects/42/views/2",
  },
  {
    label: "qc",
    desc: "QC の進捗ボード",
    href: "https://github.com/orgs/truss-company/projects/47/views/8",
  },
] as const;

interface SideRailProps {
  highlights: KobanashiWithFabulous[];
  ranking: KobanashiWithFabulous[];
  currentUserId: string | null;
}

export function SideRail({ highlights, ranking, currentUserId }: SideRailProps) {
  return (
    <section className="block-rail">
      <div>
        <div className="sec-head">
          <div className="eyebrow">
            <span className="dot" />
            Project Board
          </div>
        </div>
        <div className="proj-list">
          {PROJECT_BOARDS.map((p) => (
            <a
              key={p.href}
              className="proj-item"
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="proj-mark" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </span>
              <span className="proj-mid">
                <span className="proj-title">{p.label}</span>
                <span className="proj-desc">{p.desc}</span>
              </span>
              <span className="proj-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>
      </div>

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
