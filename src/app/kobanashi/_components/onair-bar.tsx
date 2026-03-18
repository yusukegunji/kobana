"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { finishOnAir } from "./onair-action";
import { FabulousButton } from "./fabulous-button";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function OnAirBar({
  itemId,
  itemTitle,
  onStop,
  fabulousCount,
  hasFabuloused,
  startedAt,
  currentUserId,
}: {
  itemId: string;
  itemTitle: string;
  onStop: () => void;
  fabulousCount?: number;
  hasFabuloused?: boolean;
  startedAt?: string;
  currentUserId?: string | null;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [isPending, startTransition] = useTransition();
  // DB の started_at があればそれを使い、なければ現在時刻
  const startTime = useRef(startedAt ? new Date(startedAt).getTime() : Date.now());

  useEffect(() => {
    if (startedAt) {
      startTime.current = new Date(startedAt).getTime();
    }
  }, [startedAt]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStop = useCallback(() => {
    const finalSeconds = Math.floor((Date.now() - startTime.current) / 1000);
    startTransition(async () => {
      await finishOnAir(itemId, finalSeconds);
      onStop();
    });
  }, [itemId, onStop]);

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-red-900/50 bg-red-950/80 px-4 py-3 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-red-500" />
        <span className="font-bold text-red-400">ON AIR</span>
        <span className="text-sm text-muted-foreground">{itemTitle}</span>
      </div>
      <div className="flex items-center gap-4">
        <FabulousButton
          kobanashiId={itemId}
          initialCount={fabulousCount ?? 0}
          initialFabuloused={hasFabuloused ?? false}
          currentUserId={currentUserId}
          size="lg"
        />
        <span className="font-mono text-xl font-bold tabular-nums">
          {formatTime(elapsed)}
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleStop}
          disabled={isPending}
        >
          {isPending ? "保存中..." : "終了"}
        </Button>
      </div>
    </div>
  );
}
