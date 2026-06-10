"use client";

// ルートレイアウト自体で例外が起きた場合のフォールバック。
// global-error は自前で <html>/<body> を描画する必要がある。

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
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
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40 }}>😵</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
          問題が発生しました
        </h1>
        <p style={{ color: "#a8a29e", fontSize: 14, maxWidth: 360, lineHeight: 1.7 }}>
          画面の読み込み中にエラーが発生しました。再試行してください。
        </p>
        {error.digest && (
          <p style={{ color: "#57534e", fontSize: 12, fontFamily: "monospace" }}>
            digest: {error.digest}
          </p>
        )}
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
            marginTop: 4,
          }}
        >
          再試行
        </button>
      </body>
    </html>
  );
}
