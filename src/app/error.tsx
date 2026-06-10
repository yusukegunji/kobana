"use client";

// ルート配下で投げられたクライアント例外を捕捉する。
// これが無いと例外時にページ全体が真っ白になるため、復帰可能なUIを表示する。

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 開発時の原因調査用。本番ログにも残す
    console.error("[app error]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
        background: "#0b0b0f",
        color: "#f5f5f4",
        fontFamily: "var(--font-noto-jp), sans-serif",
      }}
    >
      <div style={{ fontSize: 40 }}>😵</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
        問題が発生しました
      </h1>
      <p style={{ color: "#a8a29e", fontSize: 14, maxWidth: 360, lineHeight: 1.7 }}>
        表示中にエラーが発生しました。下のボタンで復帰できます。
        繰り返す場合はページを再読み込みしてください。
      </p>
      {error.digest && (
        <p style={{ color: "#57534e", fontSize: 12, fontFamily: "monospace" }}>
          digest: {error.digest}
        </p>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "10px 18px",
            borderRadius: 12,
            border: "none",
            background: "#ff9f1c",
            color: "#1a1206",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          再試行
        </button>
        <button
          type="button"
          onClick={() => window.location.assign("/")}
          style={{
            padding: "10px 18px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "#f5f5f4",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          トップへ戻る
        </button>
      </div>
    </div>
  );
}
