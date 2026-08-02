"use client";

import { useCallback, useState } from "react";

const TOAST_DURATION_MS = 2800;

export interface Toast {
  id: string;
  msg: string;
}

// 画面下部に一定時間だけ出るトースト。ステージ系ページで共用する
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((msg: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      TOAST_DURATION_MS,
    );
  }, []);

  return [toasts, push] as const;
}
