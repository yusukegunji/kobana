"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "./client";
import type { CurrentOnAir } from "@/lib/types";

// --- On Air リアルタイム同期 ---
export function useRealtimeOnAir() {
  const [onAir, setOnAir] = useState<CurrentOnAir | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 初期状態を取得
    supabase
      .from("current_onair")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setOnAir(data as CurrentOnAir | null);
        setLoading(false);
      });

    // リアルタイム購読
    const channel = supabase
      .channel("current_onair_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "current_onair" },
        (payload) => {
          setOnAir(payload.new as CurrentOnAir);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "current_onair" },
        () => {
          setOnAir(null);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { onAir, loading };
}

// --- Fabulous リアルタイム同期 ---
export function useRealtimeFabulous(kobanashiId: string, currentUserId: string | null) {
  const [count, setCount] = useState<number | null>(null);
  const [hasFabuloused, setHasFabuloused] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // 初期カウントを取得
    supabase
      .from("kobanashi_fabulous")
      .select("user_id")
      .eq("kobanashi_id", kobanashiId)
      .then(({ data }) => {
        const rows = data ?? [];
        setCount(rows.length);
        if (currentUserId) {
          setHasFabuloused(rows.some((r) => r.user_id === currentUserId));
        }
        initialized.current = true;
      });

    // リアルタイム購読
    const channel = supabase
      .channel(`fabulous_${kobanashiId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "kobanashi_fabulous",
          filter: `kobanashi_id=eq.${kobanashiId}`,
        },
        (payload) => {
          setCount((c) => (c ?? 0) + 1);
          if (currentUserId && (payload.new as { user_id: string }).user_id === currentUserId) {
            setHasFabuloused(true);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "kobanashi_fabulous",
          filter: `kobanashi_id=eq.${kobanashiId}`,
        },
        (payload) => {
          setCount((c) => Math.max((c ?? 1) - 1, 0));
          if (currentUserId && (payload.old as { user_id: string }).user_id === currentUserId) {
            setHasFabuloused(false);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kobanashiId, currentUserId]);

  return { count, hasFabuloused, initialized: initialized.current };
}

// --- 全体の Fabulous 変更を監視（ランキング等の更新用） ---
export function useRealtimeFabulousAll(kobanashiIds: string[], currentUserId: string | null) {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [userFabuloused, setUserFabuloused] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (kobanashiIds.length === 0) return;

    const supabase = createClient();

    // 初期データ取得
    supabase
      .from("kobanashi_fabulous")
      .select("kobanashi_id, user_id")
      .in("kobanashi_id", kobanashiIds)
      .then(({ data }) => {
        const newCounts = new Map<string, number>();
        const newUserSet = new Set<string>();
        for (const row of data ?? []) {
          newCounts.set(row.kobanashi_id, (newCounts.get(row.kobanashi_id) ?? 0) + 1);
          if (currentUserId && row.user_id === currentUserId) {
            newUserSet.add(row.kobanashi_id);
          }
        }
        setCounts(newCounts);
        setUserFabuloused(newUserSet);
      });

    // リアルタイム購読
    const channel = supabase
      .channel("fabulous_all_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "kobanashi_fabulous" },
        (payload) => {
          const row = payload.new as { kobanashi_id: string; user_id: string };
          if (!kobanashiIds.includes(row.kobanashi_id)) return;
          setCounts((prev) => {
            const next = new Map(prev);
            next.set(row.kobanashi_id, (next.get(row.kobanashi_id) ?? 0) + 1);
            return next;
          });
          if (currentUserId && row.user_id === currentUserId) {
            setUserFabuloused((prev) => new Set(prev).add(row.kobanashi_id));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "kobanashi_fabulous" },
        (payload) => {
          const row = payload.old as { kobanashi_id: string; user_id: string };
          if (!kobanashiIds.includes(row.kobanashi_id)) return;
          setCounts((prev) => {
            const next = new Map(prev);
            next.set(row.kobanashi_id, Math.max((next.get(row.kobanashi_id) ?? 1) - 1, 0));
            return next;
          });
          if (currentUserId && row.user_id === currentUserId) {
            setUserFabuloused((prev) => {
              const next = new Set(prev);
              next.delete(row.kobanashi_id);
              return next;
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kobanashiIds.join(","), currentUserId]);

  const getCount = useCallback((id: string) => counts.get(id) ?? 0, [counts]);
  const getHasFabuloused = useCallback((id: string) => userFabuloused.has(id), [userFabuloused]);

  return { getCount, getHasFabuloused };
}
