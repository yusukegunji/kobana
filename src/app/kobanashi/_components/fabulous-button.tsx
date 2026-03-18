"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toggleFabulous } from "./fabulous-action";
import { useRealtimeFabulous } from "@/lib/supabase/realtime";

export function FabulousButton({
  kobanashiId,
  initialCount,
  initialFabuloused,
  currentUserId,
  size = "default",
}: {
  kobanashiId: string;
  initialCount: number;
  initialFabuloused: boolean;
  currentUserId?: string | null;
  size?: "default" | "lg";
}) {
  const { count: realtimeCount, hasFabuloused: realtimeFabuloused } =
    useRealtimeFabulous(kobanashiId, currentUserId ?? null);

  // リアルタイムデータが取得できたらそちらを優先
  const count = realtimeCount ?? initialCount;
  const fabuloused = realtimeCount !== null ? realtimeFabuloused : initialFabuloused;

  const [optimisticDelta, setOptimisticDelta] = useState(0);
  const [optimisticFabuloused, setOptimisticFabuloused] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const [animate, setAnimate] = useState(false);

  // リアルタイム更新が来たら楽観的更新をリセット
  useEffect(() => {
    setOptimisticDelta(0);
    setOptimisticFabuloused(null);
  }, [realtimeCount, realtimeFabuloused]);

  const displayCount = count + optimisticDelta;
  const displayFabuloused = optimisticFabuloused ?? fabuloused;

  const handleClick = useCallback(() => {
    const wasFabuloused = displayFabuloused;
    setOptimisticFabuloused(!wasFabuloused);
    setOptimisticDelta(wasFabuloused ? -1 : 1);
    if (!wasFabuloused) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 600);
    }

    startTransition(async () => {
      const result = await toggleFabulous(kobanashiId);
      if (result.error) {
        // ロールバック
        setOptimisticFabuloused(null);
        setOptimisticDelta(0);
      }
    });
  }, [kobanashiId, displayFabuloused]);

  const isLg = size === "lg";

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`group inline-flex items-center gap-1.5 rounded-full border transition-all duration-200 ${
        displayFabuloused
          ? "border-pink-500/50 bg-pink-500/20 text-pink-300 shadow-lg shadow-pink-500/20"
          : "border-white/10 bg-white/5 text-stone-400 hover:border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-300"
      } ${isLg ? "px-5 py-2 text-base" : "px-3 py-1 text-sm"} disabled:opacity-70`}
    >
      <span
        className={`transition-transform duration-200 ${animate ? "scale-150" : "scale-100"} ${displayFabuloused ? "drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]" : ""}`}
      >
        {displayFabuloused ? "💖" : "🤍"}
      </span>
      <span className="font-bold tabular-nums">{displayCount}</span>
      {isLg && (
        <span className="text-xs opacity-70">Fabulous!</span>
      )}
    </button>
  );
}
