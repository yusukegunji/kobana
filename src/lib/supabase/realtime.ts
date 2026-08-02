"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "./client";
import type {
  CurrentOnAir,
  Poll,
  PollOptionResult,
  PollVoter,
} from "@/lib/types";

// 「それ正解」の同期フックは ./realtime-seikai の useRealtimeSeikai にある

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

// --- ライブ投票 リアルタイム同期 ---
// 最新の投票（live なら受付中、ended なら結果、無ければ setup）をリアルタイムに購読する。
export function useRealtimePoll(currentUserId: string | null) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOptionResult[]>([]);
  const [voters, setVoters] = useState<PollVoter[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const pollIdRef = useRef<string | null>(null);
  const namesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadVotes(pollId: string) {
      const { data: voteRows } = await supabase
        .from("poll_votes")
        .select("option_id, user_id")
        .eq("poll_id", pollId);
      const { data: optRows } = await supabase
        .from("poll_options")
        .select("id, label, color, position")
        .eq("poll_id", pollId)
        .order("position", { ascending: true });
      if (!active) return;

      const rows = voteRows ?? [];
      const counts = new Map<string, number>();
      for (const r of rows) {
        counts.set(r.option_id, (counts.get(r.option_id) ?? 0) + 1);
      }
      setOptions(
        (optRows ?? []).map((o) => ({
          id: o.id,
          label: o.label,
          color: o.color,
          votes: counts.get(o.id) ?? 0,
        })),
      );
      setVoters(
        rows.map((r) => ({
          userId: r.user_id,
          name: namesRef.current.get(r.user_id) ?? "?",
        })),
      );
      setMyVote(
        currentUserId
          ? (rows.find((r) => r.user_id === currentUserId)?.option_id ?? null)
          : null,
      );
    }

    async function loadCurrentPoll() {
      const { data } = await supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;

      const next = (data as Poll | null) ?? null;
      pollIdRef.current = next?.id ?? null;
      setPoll(next);
      if (next) {
        await loadVotes(next.id);
      } else {
        setOptions([]);
        setVoters([]);
        setMyVote(null);
      }
      setLoading(false);
    }

    // 投票者の表示名を解決するためプロフィールを取得
    supabase
      .from("profiles")
      .select("id, display_name")
      .then(({ data }) => {
        const map = new Map<string, string>();
        for (const row of data ?? []) {
          map.set(row.id, row.display_name);
        }
        namesRef.current = map;
        loadCurrentPoll();
      });

    const channel = supabase
      .channel("polls_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "polls" },
        () => {
          loadCurrentPoll();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes" },
        () => {
          if (pollIdRef.current) loadVotes(pollIdRef.current);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return { poll, options, voters, myVote, loading };
}
