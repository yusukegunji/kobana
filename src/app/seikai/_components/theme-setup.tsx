"use client";

import { useState, useTransition } from "react";
import { startGame } from "../actions";
import { pickRandomTheme } from "../themes";

interface ThemeSetupProps {
  isHost: boolean;
  facilitatorName: string | null;
  pushToast: (msg: string) => void;
}

export function ThemeSetup({
  isHost,
  facilitatorName,
  pushToast,
}: ThemeSetupProps) {
  const [theme, setTheme] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isHost) {
    return (
      <div className="card seikai-panel">
        <div className="eyebrow">
          <span className="dot" />
          それ正解
        </div>
        <div className="seikai-theme seikai-theme--idle">
          お題を待っています…
        </div>
        <p className="seikai-note">
          司会の <b>{facilitatorName ?? "ファシリテーター"}</b>{" "}
          さんがお題を出すと、この画面に表示されます。
        </p>
      </div>
    );
  }

  function start() {
    const trimmed = theme.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await startGame(trimmed);
      if (res.error) {
        pushToast("⚠️ " + res.error);
        return;
      }
      setTheme("");
      pushToast("📣 お題を出しました — 全員の画面に表示中");
    });
  }

  return (
    <div className="card seikai-panel">
      <div className="eyebrow">
        <span className="dot" />
        それ正解 · お題をつくる
      </div>
      <p className="seikai-note">
        お題を出すと全員が一斉に回答します。締め切るまで、他の人の回答は誰にも見えません。
      </p>

      <div className="field seikai-field">
        <label htmlFor="seikai-theme">お題</label>
        <input
          id="seikai-theme"
          className="input"
          value={theme}
          maxLength={120}
          placeholder="例：赤いものといえば？"
          onChange={(e) => setTheme(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") start();
          }}
        />
      </div>

      <div className="seikai-actions">
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => setTheme(pickRandomTheme(theme))}
        >
          🎲 お題をシャッフル
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={start}
          disabled={!theme.trim() || isPending}
        >
          {isPending ? "出題中…" : "📣 お題を出す"}
        </button>
      </div>
    </div>
  );
}
