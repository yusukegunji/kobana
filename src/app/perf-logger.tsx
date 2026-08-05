"use client";

import { useEffect } from "react";

// ブラウザ側の内訳を DevTools のコンソールに1行で出す。
// 「HTML が返るまでが遅い（= サーバー）」のか「JS/フォントの読み込みが遅い（= 回線・容量）」
// のかを、DevTools に不慣れでも判断できるようにするための計測用。
// 原因が特定できたら削除する。
export function PerfLogger() {
  useEffect(() => {
    const report = () => {
      const nav = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming | undefined;
      if (!nav) return;

      const resources = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      const transferredKB = Math.round(
        resources.reduce((sum, r) => sum + (r.transferSize ?? 0), 0) / 1024,
      );

      // 読み込みに時間がかかった上位3件（何が足を引っ張ったか）
      const slowest = [...resources]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 3)
        .map((r) => `${r.name.split("/").pop()}:${Math.round(r.duration)}ms`);

      console.log(
        [
          "[perf]",
          `HTML応答開始=${Math.round(nav.responseStart)}ms`,
          `HTML受信完了=${Math.round(nav.responseEnd)}ms`,
          `DOM構築完了=${Math.round(nav.domContentLoadedEventEnd)}ms`,
          `全読み込み完了=${Math.round(nav.loadEventEnd)}ms`,
          `リソース${resources.length}件/${transferredKB}KB`,
          `遅い順: ${slowest.join(" ")}`,
        ].join("  "),
      );
    };

    if (document.readyState === "complete") {
      report();
    } else {
      window.addEventListener("load", report, { once: true });
      return () => window.removeEventListener("load", report);
    }
  }, []);

  return null;
}
