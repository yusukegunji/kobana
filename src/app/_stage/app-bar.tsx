import Link from "next/link";
import { BrandLogo } from "./stage-ui";

interface AppBarProps {
  onAirSpeaker?: string | null;
}

export function AppBar({ onAirSpeaker = null }: AppBarProps) {
  return (
    <header className="appbar">
      <BrandLogo />
      <nav className="nav">
        {onAirSpeaker && (
          <div className="now-pill">
            <span className="live-dot" />
            <span>
              朝会ライブ中 ·{" "}
              <b style={{ color: "var(--text)" }}>{onAirSpeaker}</b> が発表中
            </span>
          </div>
        )}
        <Link className="navlink" href="/seikai">
          それ正解
        </Link>
        <Link className="navlink" href="/calendar">
          カレンダー
        </Link>
        <Link className="navlink" href="/kobanashi">
          ダッシュボード
        </Link>
        <Link className="navlink" href="/mypage">
          マイページ
        </Link>
      </nav>
    </header>
  );
}
