"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "./client";
import { todayInJST } from "@/lib/date";
import type {
  SeikaiAnswer,
  SeikaiAnswerView,
  SeikaiGame,
  SeikaiScore,
} from "@/lib/types";

// --- それ正解 リアルタイム同期 ---
// 最新の1ゲームを全員で共有する（polls と同じく画面には常に最新の1件だけを出す）。
// 締切前は RLS により自分の回答しか取得できないため、「誰が回答済みか」は
// seikai_games.answered_user_ids（トリガで同期）から得る。公開時は games 側の
// status 更新イベントが全クライアントの再取得トリガも兼ねる。
export function useRealtimeSeikai(currentUserId: string | null) {
  const [game, setGame] = useState<SeikaiGame | null>(null);
  const [answers, setAnswers] = useState<SeikaiAnswerView[]>([]);
  const [scores, setScores] = useState<SeikaiScore[]>([]);
  const [loading, setLoading] = useState(true);

  const gameIdRef = useRef<string | null>(null);
  const namesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const nameOf = (id: string) => namesRef.current.get(id) ?? "?";

    async function loadAnswers(gameId: string) {
      const { data } = await supabase
        .from("seikai_answers")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });
      if (!active) return;
      setAnswers(
        (data ?? []).map((row) => {
          const answer = row as SeikaiAnswer;
          return { ...answer, name: nameOf(answer.user_id) };
        }),
      );
    }

    // 今日のゲームでの正解数を集計する（公開前のゲームの回答は RLS で読めないため
    // 自然に集計対象から外れる）。スコアが動くのは is_correct の更新時だけなので、
    // 初回ロードと seikai_answers の変更時にだけ呼ぶ。
    async function loadScores() {
      const { data: games } = await supabase
        .from("seikai_games")
        .select("id")
        .gte("created_at", `${todayInJST()}T00:00:00+09:00`);
      const ids = (games ?? []).map((g) => g.id);
      if (ids.length === 0) {
        if (active) setScores([]);
        return;
      }

      const { data: rows } = await supabase
        .from("seikai_answers")
        .select("user_id")
        .eq("is_correct", true)
        .in("game_id", ids);
      if (!active) return;

      const counts = new Map<string, number>();
      for (const row of rows ?? []) {
        counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
      }
      setScores(
        [...counts.entries()]
          .map(([userId, correctCount]) => ({
            userId,
            name: nameOf(userId),
            correctCount,
          }))
          .sort((a, b) => b.correctCount - a.correctCount),
      );
    }

    async function loadCurrentGame() {
      const { data } = await supabase
        .from("seikai_games")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;

      const next = (data as SeikaiGame | null) ?? null;
      gameIdRef.current = next?.id ?? null;
      setGame(next);
      if (next) {
        await loadAnswers(next.id);
      } else {
        setAnswers([]);
      }
    }

    // 回答者の表示名を解決するためプロフィールを先に取得する
    supabase
      .from("profiles")
      .select("id, display_name")
      .then(async ({ data }) => {
        const map = new Map<string, string>();
        for (const row of data ?? []) {
          map.set(row.id, row.display_name);
        }
        namesRef.current = map;
        await loadCurrentGame();
        await loadScores();
        if (active) setLoading(false);
      });

    const channel = supabase
      .channel("seikai_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seikai_games" },
        () => {
          loadCurrentGame();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seikai_answers" },
        () => {
          if (!gameIdRef.current) return;
          loadAnswers(gameIdRef.current);
          loadScores();
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const myAnswer = currentUserId
    ? (answers.find((a) => a.user_id === currentUserId) ?? null)
    : null;

  return { game, answers, myAnswer, scores, loading };
}
