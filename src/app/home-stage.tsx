"use client";

import Link from "next/link";
import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useTransition,
  Suspense,
} from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import type { Kobanashi, KobanashiWithFabulous } from "@/lib/types";
import { startOnAir, finishOnAir } from "./kobanashi/_components/onair-action";
import { useRealtimeOnAir } from "@/lib/supabase/realtime";
import { ConfettiBurst } from "@/components/confetti-burst";
import { FabulousButton } from "./kobanashi/_components/fabulous-button";

// 3D背景を動的インポート（SSR無効）
const StageBackground = dynamic(
  () =>
    import("@/components/stage-background").then((mod) => mod.StageBackground),
  { ssr: false },
);

// Three.js 3Dダイスを動的インポート（SSR無効）
const Dice3D = dynamic(
  () => import("@/components/dice-3d").then((mod) => mod.Dice3D),
  { ssr: false },
);

const TITLE_GRADIENTS = [
  "from-blue-500 to-blue-600",
  "from-red-500 to-rose-600",
  "from-yellow-400 to-amber-500",
  "from-green-500 to-emerald-600",
  "from-purple-500 to-violet-600",
  "from-pink-500 to-rose-500",
  "from-orange-500 to-amber-600",
  "from-cyan-400 to-teal-500",
  "from-indigo-500 to-blue-600",
];

// --- タイトル: KOBANASHI ローマ字（Bebas Neue + グラデブロック） ---
function BrandTitle() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const letters = "KOBANASHI".split("");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {letters.map((char, i) => (
          <span
            key={i}
            className={`bg-linear-to-br ${TITLE_GRADIENTS[i % TITLE_GRADIENTS.length]} inline-flex h-14 w-14 items-center justify-center rounded-xl text-5xl leading-none text-white shadow-lg transition-transform hover:-rotate-6 hover:scale-125 sm:h-16 sm:w-16 sm:text-6xl ${mounted ? "animate-drop-in" : "opacity-0"}`}
            style={{
              animationDelay: `${i * 0.06}s`,
              fontFamily: "var(--font-display), sans-serif",
              paddingTop: "0.1em",
            }}
          >
            {char}
          </span>
        ))}
      </div>
      <p
        className={`text-sm tracking-[0.3em] text-amber-200/40 ${mounted ? "animate-slide-up-fade" : "opacity-0"}`}
        style={{ animationDelay: "0.7s" }}
      >
        今日もすべらない
      </p>
    </div>
  );
}

function formatDuration(minutes: number | null) {
  if (minutes == null) return "";
  return `${minutes}分`;
}

// --- Game Design: 3Dサイコロローラー ---
// MDA: INPUT(振る) → PROCESS(3D回転) → FEEDBACK(シェイク+グロー) → REWARD(コンフェティ) → REPEAT
function DiceRoller({
  speakers,
  onSelected,
  disabled,
  onResult,
}: {
  speakers: string[];
  onSelected: (speaker: string) => void;
  disabled: boolean;
  onResult: () => void;
}) {
  const [rolling, setRolling] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roll = useCallback(() => {
    if (speakers.length === 0 || rolling) return;

    setRolling(true);
    setResult(null);
    setShowResult(false);
    setResultIndex(null);

    const finalIndex = Math.floor(Math.random() * speakers.length);
    // resultIndex はそのまま finalIndex を使う

    // 名前スロットのアニメーション（徐々に減速）
    const totalDuration = 3500; // 3.5秒間回転
    const startTime = Date.now();
    let step = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // イージング: 最初は速く、徐々に減速（物理的な摩擦シミュレーション）
      // progress^2 で指数的に減速
      const interval = 80 + Math.pow(progress, 2) * 400;

      step++;
      setCurrentIndex(step % speakers.length);

      if (progress < 1) {
        intervalRef.current = setTimeout(animate, interval);
      } else {
        // 最終結果
        setCurrentIndex(finalIndex);
        setRolling(false);
        setResultIndex(finalIndex);

        // シェイク
        setShaking(true);
        timeoutRef.current = setTimeout(() => setShaking(false), 500);

        // 結果表示
        setTimeout(() => {
          setResult(speakers[finalIndex]);
          setShowResult(true);
          onResult();
        }, 400);
      }
    };

    // 少しの溜めの後にスタート
    timeoutRef.current = setTimeout(animate, 200);
  }, [speakers, rolling, onResult]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`flex flex-col items-center gap-6 px-6 py-10 ${shaking ? "animate-screen-shake" : ""}`}
    >
      {/* 3Dサイコロ */}
      <div className={`relative ${rolling ? "animate-glow-pulse" : ""}`}>
        <Dice3D
          names={speakers}
          rolling={rolling}
          resultIndex={resultIndex}
          size={160}
        />
        {/* ローリング中の影 */}
        {rolling && (
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-amber-500/20 blur-xl"
            style={{ width: 100, height: 16 }}
          />
        )}
      </div>

      {/* ユーザー一覧 */}
      <div className="flex flex-wrap justify-center gap-2">
        {speakers.map((name, i) => (
          <span
            key={name}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
              rolling && currentIndex === i
                ? "scale-115 bg-amber-400 text-stone-900 shadow-lg shadow-amber-400/30"
                : result === name
                  ? "animate-breathe bg-amber-400 text-stone-900 ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-900"
                  : "bg-white/5 text-emerald-300/80 backdrop-blur-sm"
            }`}
          >
            {name}
          </span>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="flex gap-3">
        {!result ? (
          <Button
            onClick={roll}
            disabled={rolling || disabled || speakers.length === 0}
            className={`px-10 text-lg font-bold transition-all ${
              rolling
                ? "animate-pulse bg-amber-600 text-amber-100"
                : "bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/30 hover:bg-amber-400 hover:shadow-amber-400/50 hover:scale-105"
            } disabled:opacity-50 disabled:shadow-none`}
            size="lg"
          >
            {rolling ? "..." : "サイコロを振る"}
          </Button>
        ) : (
          <div className="animate-slide-up-fade flex flex-col items-center gap-3">
            <p className="text-base font-bold text-amber-300">
              {result}さん、STOCKから披露する話を選んでください
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => onSelected(result)}
                disabled={disabled}
                className="bg-amber-500 px-8 text-lg font-bold text-stone-900 shadow-lg shadow-amber-500/30 hover:bg-amber-400 hover:shadow-amber-400/50 hover:scale-105 transition-all"
                size="lg"
              >
                STOCKを表示
              </Button>
              <Button
                onClick={() => {
                  setResult(null);
                  setShowResult(false);
                  setResultIndex(null);
                }}
                variant="outline"
                className="border-emerald-500/50 text-emerald-300 backdrop-blur-sm hover:bg-emerald-800/50 hover:border-emerald-400 transition-all"
                size="lg"
              >
                もう一度
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 待機アイテム行 ---
function WaitingItemRow({
  item,
  onAirItem,
  onStart,
  index,
  currentUserId,
}: {
  item: KobanashiWithFabulous;
  onAirItem: { id: string; title: string } | null;
  onStart: () => void;
  index: number;
  currentUserId: string | null;
}) {
  return (
    <div
      className="animate-slide-up-fade flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/5"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div>
        <p className="font-bold text-white">{item.title}</p>
        <p className="text-sm text-emerald-300/80">{item.speaker}</p>
      </div>
      <div className="flex items-center gap-3">
        {onAirItem?.id === item.id && (
          <FabulousButton
            kobanashiId={item.id}
            initialCount={item.fabulous_count}
            initialFabuloused={item.has_fabuloused}
            currentUserId={currentUserId}
            size="lg"
          />
        )}
        {!onAirItem && (
          <Button
            variant="outline"
            size="sm"
            className="border-amber-400/50 bg-transparent text-amber-300 backdrop-blur-sm hover:bg-amber-400 hover:text-stone-900 hover:scale-105 transition-all"
            onClick={onStart}
          >
            On Air
          </Button>
        )}
        {onAirItem?.id === item.id && (
          <span className="flex items-center gap-2 text-sm font-bold text-red-400">
            <span className="inline-block h-3 w-3 animate-breathe rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            ON AIR
          </span>
        )}
      </div>
    </div>
  );
}

// --- On Stage 内 ON AIR コントロール ---
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function OnStageAirControls({
  itemId,
  itemTitle,
  onStop,
  fabulousCount,
  hasFabuloused,
  currentUserId,
  startedAt,
}: {
  itemId: string;
  itemTitle: string;
  onStop: () => void;
  fabulousCount?: number;
  hasFabuloused?: boolean;
  currentUserId: string | null;
  startedAt?: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [isPending, startTransition] = useTransition();
  const startTime = useRef(
    startedAt ? new Date(startedAt).getTime() : Date.now(),
  );

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
    <div className="mx-4 mb-2 mt-1 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
        <span className="text-sm font-bold text-red-400">ON AIR</span>
        <span className="text-sm text-stone-400 truncate max-w-40">
          {itemTitle}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <FabulousButton
          kobanashiId={itemId}
          initialCount={fabulousCount ?? 0}
          initialFabuloused={hasFabuloused ?? false}
          currentUserId={currentUserId}
          size="lg"
        />
        <span className="font-mono text-xl font-bold tabular-nums text-red-300">
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

// --- 完了アイテム行 ---
function DoneItemRow({
  item,
  index,
  currentUserId,
}: {
  item: KobanashiWithFabulous;
  index: number;
  currentUserId: string | null;
}) {
  return (
    <div
      className="animate-slide-up-fade flex items-center justify-between px-6 py-4 opacity-70 transition-opacity hover:opacity-100"
      style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
    >
      <div>
        <p className="font-bold text-white/70 line-through">{item.title}</p>
        <p className="text-sm text-emerald-300/50">{item.speaker}</p>
      </div>
      <div className="flex items-center gap-3">
        <FabulousButton
          kobanashiId={item.id}
          initialCount={item.fabulous_count}
          initialFabuloused={item.has_fabuloused}
          currentUserId={currentUserId}
        />
        <span className="text-sm text-emerald-400/70">
          {formatDuration(item.duration)}
        </span>
      </div>
    </div>
  );
}

// --- ハイライトカード - Game Design: 達成感カード ---
function HighlightCard({
  item,
  index,
  currentUserId,
}: {
  item: KobanashiWithFabulous;
  index: number;
  currentUserId: string | null;
}) {
  return (
    <div
      className="animate-slide-up-fade group rounded-xl border border-amber-900/20 bg-amber-950/30 px-5 py-4 backdrop-blur-lg transition-all duration-300 hover:border-amber-700/40 hover:bg-amber-950/50 hover:shadow-lg hover:shadow-amber-900/30 hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 0.08 + 0.2}s` }}
    >
      <p className="font-medium text-stone-200 group-hover:text-white transition-colors">
        {item.title}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-950/50 px-2 py-0.5 text-xs text-emerald-400/80">
            {item.speaker}
          </span>
          {item.duration != null && (
            <span className="text-xs text-stone-500">{item.duration}分</span>
          )}
        </div>
        <FabulousButton
          kobanashiId={item.id}
          initialCount={item.fabulous_count}
          initialFabuloused={item.has_fabuloused}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}

// --- ランキングカード ---
function RankingCard({
  item,
  rank,
  currentUserId,
}: {
  item: KobanashiWithFabulous;
  rank: number;
  currentUserId: string | null;
}) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-pink-900/20 bg-pink-950/20 px-4 py-3 backdrop-blur-lg transition-all hover:border-pink-700/30 hover:bg-pink-950/30">
      <span className="text-xl font-bold tabular-nums">
        {rank <= 3 ? medals[rank - 1] : `${rank}.`}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-stone-200">
          {item.title}
        </p>
        <span className="text-xs text-emerald-400/70">{item.speaker}</span>
      </div>
      <FabulousButton
        kobanashiId={item.id}
        initialCount={item.fabulous_count}
        initialFabuloused={item.has_fabuloused}
        currentUserId={currentUserId}
      />
    </div>
  );
}

// === メインステージ ===
export function HomeStage({
  todayItems,
  recentItems,
  allItems,
  allUserNames,
  todayFacilitator,
  isFacilitator,
  rankingItems,
  currentUserId,
}: {
  todayItems: KobanashiWithFabulous[];
  recentItems: KobanashiWithFabulous[];
  allItems: Kobanashi[];
  allUserNames: string[];
  todayFacilitator: string | null;
  isFacilitator: boolean;
  rankingItems: KobanashiWithFabulous[];
  currentUserId: string | null;
}) {
  // リアルタイムOn Air状態を購読
  const { onAir } = useRealtimeOnAir();

  // リアルタイムのOn Air状態からonAirItemを導出
  const onAirItem = (() => {
    if (!onAir) return null;
    // todayItemsまたはallItemsからタイトルを探す
    const found =
      todayItems.find((i) => i.id === onAir.kobanashi_id) ??
      allItems.find((i) => i.id === onAir.kobanashi_id);
    if (found) return { id: found.id, title: found.title };
    return { id: onAir.kobanashi_id, title: "" };
  })();

  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);

  const waitingItems = todayItems.filter((item) => !item.published_at);
  const doneItems = todayItems.filter((item) => item.published_at);

  // ダイスで選ばれたスピーカーのストックだけ表示
  const filteredStockItems = selectedSpeaker
    ? allItems.filter((item) => item.speaker === selectedSpeaker)
    : allItems;

  const handleDiceResult = useCallback(() => {
    setConfettiKey((k) => k + 1);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 100);
  }, []);

  const handleDiceSelected = useCallback((speaker: string) => {
    setSelectedSpeaker(speaker);
  }, []);

  const handleStockSelect = useCallback((item: Kobanashi) => {
    startOnAir(item.id);
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "#0a0704" }}
    >
      {/* 3D背景 */}
      <Suspense fallback={null}>
        <StageBackground />
      </Suspense>

      {/* コンフェティ (Game Design: 報酬フィードバック) */}
      <ConfettiBurst
        key={confettiKey}
        trigger={showConfetti}
        originX={0.5}
        originY={0.35}
        particleCount={50}
      />

      {/* コンテンツ */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header: タイトル左上 + ナビ右上 */}
        <div className="flex items-start justify-between px-6 pt-6 sm:px-10 sm:pt-8">
          <BrandTitle />
          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/calendar"
              className="rounded-full border border-amber-800/30 bg-amber-950/30 px-4 py-1.5 text-sm text-amber-200/60 backdrop-blur-md transition-all duration-200 hover:bg-amber-900/40 hover:text-amber-100 hover:border-amber-700/40"
            >
              カレンダー
            </Link>
            <Link
              href="/kobanashi"
              className="rounded-full border border-amber-800/30 bg-amber-950/30 px-4 py-1.5 text-sm text-amber-200/60 backdrop-blur-md transition-all duration-200 hover:bg-amber-900/40 hover:text-amber-100 hover:border-amber-700/40"
            >
              ダッシュボード
            </Link>
            <Link
              href="/mypage"
              className="rounded-full border border-amber-800/30 bg-amber-950/30 px-4 py-1.5 text-sm text-amber-200/60 backdrop-blur-md transition-all duration-200 hover:bg-amber-900/40 hover:text-amber-100 hover:border-amber-700/40"
            >
              マイページ
            </Link>
          </div>
        </div>

        {/* メインエリア: 左（ストック一覧） / 中央（サイコロ+今日） / 右（ハイライト） */}
        <div className="mx-auto flex w-full max-w-360 flex-1 gap-6 px-4 pt-8 pb-20 sm:px-10 lg:gap-8">
          {/* 左カラム: ダッシュボードのこばなしストック */}
          {allItems.length > 0 && (
            <div className="hidden w-64 shrink-0 lg:block xl:w-72">
              <div className="sticky top-8">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className={`text-xs font-bold tracking-[0.25em] uppercase ${selectedSpeaker ? "text-amber-300/80" : "text-amber-300/40"}`}
                  >
                    {selectedSpeaker ? `${selectedSpeaker} の Stock` : "Stock"}
                  </h2>
                  {selectedSpeaker ? (
                    <button
                      onClick={() => setSelectedSpeaker(null)}
                      className="text-xs text-amber-400/50 hover:text-amber-300 transition-colors"
                    >
                      全員表示
                    </button>
                  ) : (
                    <Link
                      href="/kobanashi"
                      className="text-xs text-amber-400/50 hover:text-amber-300 transition-colors"
                    >
                      すべて見る →
                    </Link>
                  )}
                </div>
                {selectedSpeaker && filteredStockItems.length === 0 ? (
                  <div className="animate-slide-up-fade rounded-lg border border-amber-900/30 bg-amber-950/30 px-4 py-6 text-center">
                    <p className="text-sm text-amber-300/60">
                      {selectedSpeaker}さんのストックがありません
                    </p>
                    <Link
                      href="/kobanashi/new"
                      className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-300 transition-all hover:bg-amber-500/20 hover:border-amber-400/50"
                    >
                      <span>+</span> 新規追加
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredStockItems.map((item, i) => (
                      <button
                        key={item.id}
                        onClick={() => handleStockSelect(item)}
                        disabled={!!onAirItem}
                        className={`animate-slide-up-fade group rounded-lg border px-4 py-3 backdrop-blur-lg transition-all duration-200 text-left ${
                          selectedSpeaker
                            ? "border-amber-500/40 bg-amber-950/40 hover:border-amber-400/60 hover:bg-amber-950/60 hover:shadow-md hover:shadow-amber-900/20 hover:-translate-y-0.5 cursor-pointer"
                            : "border-emerald-900/30 bg-emerald-950/40 hover:border-emerald-700/40 hover:bg-emerald-950/60"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <p className="text-sm font-medium text-stone-300 group-hover:text-white transition-colors truncate">
                          {item.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {!selectedSpeaker && (
                            <span className="text-xs text-emerald-400/60">
                              {item.speaker}
                            </span>
                          )}
                          {item.scheduled_date && (
                            <span className="text-xs text-stone-600">
                              {item.scheduled_date}
                            </span>
                          )}
                        </div>
                        {selectedSpeaker && (
                          <span className="mt-2 inline-block text-xs font-semibold text-amber-400/70 group-hover:text-amber-300 transition-colors">
                            これを披露する →
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 中央カラム: サイコロ or On Stage（排他表示） */}
          <div className="flex-1 min-w-0">
            {/* On Air 中: On Stage セクションを表示 */}
            {onAirItem ? (
              <div className="overflow-hidden rounded-3xl border border-red-500/40 bg-emerald-950/70 shadow-2xl shadow-black/50 backdrop-blur-2xl ring-1 ring-red-500/20 transition-colors">
                <div className="h-1 bg-linear-to-r from-red-800 via-red-500 to-red-800 animate-pulse" />
                <div className="px-6 pt-6 pb-2">
                  <h2 className="text-center text-sm font-bold tracking-[0.2em] uppercase text-red-400">
                    On Stage
                  </h2>
                </div>
                <OnStageAirControls
                  itemId={onAirItem.id}
                  itemTitle={onAirItem.title}
                  onStop={() => {}}
                  fabulousCount={
                    todayItems.find((i) => i.id === onAirItem.id)
                      ?.fabulous_count
                  }
                  hasFabuloused={
                    todayItems.find((i) => i.id === onAirItem.id)
                      ?.has_fabuloused
                  }
                  currentUserId={currentUserId}
                  startedAt={onAir?.started_at}
                />
                {(waitingItems.length > 0 || doneItems.length > 0) && (
                  <div className="divide-y divide-white/5 py-2">
                    {waitingItems.map((item, i) => (
                      <WaitingItemRow
                        key={item.id}
                        item={item}
                        onAirItem={onAirItem}
                        onStart={() => startOnAir(item.id)}
                        index={i}
                        currentUserId={currentUserId}
                      />
                    ))}
                    {doneItems.map((item, i) => (
                      <DoneItemRow
                        key={item.id}
                        item={item}
                        index={i}
                        currentUserId={currentUserId}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 通常時: Today's Speaker セクション */}
                {allUserNames.length > 0 && (
                  <div className="overflow-hidden rounded-3xl border border-white/6 bg-black/40 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    <div className="px-6 pt-6 pb-2">
                      <h2 className="text-center text-xs font-semibold tracking-[0.25em] text-amber-200/50 uppercase">
                        Today&apos;s Speaker
                      </h2>
                      {todayFacilitator && (
                        <p className="mt-1 text-center text-xs text-emerald-400/60">
                          本日のファシリテーター:{" "}
                          <span className="font-bold text-emerald-300">
                            {todayFacilitator}
                          </span>
                        </p>
                      )}
                    </div>
                    {isFacilitator ? (
                      <DiceRoller
                        speakers={allUserNames}
                        onSelected={handleDiceSelected}
                        disabled={false}
                        onResult={handleDiceResult}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-4 px-6 py-10">
                        <Dice3D
                          names={allUserNames}
                          rolling={false}
                          resultIndex={null}
                          size={160}
                        />
                        <div className="flex flex-wrap justify-center gap-2">
                          {allUserNames.map((name) => (
                            <span
                              key={name}
                              className="rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-emerald-300/80 backdrop-blur-sm"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-stone-400">
                          {todayFacilitator
                            ? `サイコロを振れるのは ${todayFacilitator} さんだけです`
                            : "本日のファシリテーターが未設定です"}
                        </p>
                        <Link
                          href="/calendar"
                          className="text-xs text-amber-400/60 hover:text-amber-300 transition-colors"
                        >
                          カレンダーで担当を確認 →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* 公開済みリスト */}
                {doneItems.length > 0 && (
                  <div className="mt-6 overflow-hidden rounded-3xl border border-amber-900/40 bg-emerald-950/70 shadow-2xl shadow-black/50 backdrop-blur-2xl">
                    <div className="h-1 bg-linear-to-r from-amber-800 via-amber-500 to-amber-800" />
                    <div className="px-6 pt-6 pb-2">
                      <h2 className="text-center text-sm font-bold tracking-[0.2em] uppercase text-amber-300/80">
                        Today&apos;s Done
                      </h2>
                    </div>
                    <div className="divide-y divide-white/5 py-2">
                      {doneItems.map((item, i) => (
                        <DoneItemRow
                          key={item.id}
                          item={item}
                          index={i}
                          currentUserId={currentUserId}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 右カラム: Recent Highlights + Ranking（縦1列） */}
          {(recentItems.length > 0 || rankingItems.length > 0) && (
            <div className="hidden w-64 shrink-0 lg:block xl:w-72">
              <div className="sticky top-8 flex flex-col gap-8">
                {recentItems.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-xs font-bold tracking-[0.25em] text-amber-300/40 uppercase">
                      Recent Highlights
                    </h2>
                    <div className="flex flex-col gap-3">
                      {recentItems.map((item, i) => (
                        <HighlightCard
                          key={item.id}
                          item={item}
                          index={i}
                          currentUserId={currentUserId}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {rankingItems.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-xs font-bold tracking-[0.25em] text-pink-300/50 uppercase">
                      Fabulous Ranking
                    </h2>
                    <div className="flex flex-col gap-2">
                      {rankingItems.map((item, i) => (
                        <RankingCard
                          key={item.id}
                          item={item}
                          rank={i + 1}
                          currentUserId={currentUserId}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* モバイル用: ストック + ハイライト + ランキング（lg未満では下に表示） */}
        <div className="flex flex-col gap-8 px-4 pb-20 lg:hidden sm:px-10">
          {allItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2
                  className={`text-xs font-bold tracking-[0.25em] uppercase ${selectedSpeaker ? "text-amber-300/80" : "text-amber-300/40"}`}
                >
                  {selectedSpeaker ? `${selectedSpeaker} の Stock` : "Stock"}
                </h2>
                {selectedSpeaker ? (
                  <button
                    onClick={() => setSelectedSpeaker(null)}
                    className="text-xs text-amber-400/50 hover:text-amber-300 transition-colors"
                  >
                    全員表示
                  </button>
                ) : (
                  <Link
                    href="/kobanashi"
                    className="text-xs text-amber-400/50 hover:text-amber-300 transition-colors"
                  >
                    すべて見る →
                  </Link>
                )}
              </div>
              {selectedSpeaker && filteredStockItems.length === 0 ? (
                <div className="animate-slide-up-fade rounded-lg border border-amber-900/30 bg-amber-950/30 px-4 py-6 text-center">
                  <p className="text-sm text-amber-300/60">
                    {selectedSpeaker}さんのストックがありません
                  </p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {filteredStockItems.slice(0, 6).map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => handleStockSelect(item)}
                      disabled={!!onAirItem}
                      className={`animate-slide-up-fade rounded-lg border px-4 py-3 backdrop-blur-lg text-left transition-all ${
                        selectedSpeaker
                          ? "border-amber-500/40 bg-amber-950/40 hover:border-amber-400/60 hover:bg-amber-950/60"
                          : "border-emerald-900/30 bg-emerald-950/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <p className="text-sm font-medium text-stone-300 truncate">
                        {item.title}
                      </p>
                      <span className="text-xs text-emerald-400/60">
                        {selectedSpeaker ? "これを披露する →" : item.speaker}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {recentItems.length > 0 && (
            <div>
              <h2 className="mb-4 text-xs font-bold tracking-[0.25em] text-amber-300/40 uppercase">
                Recent Highlights
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {recentItems.map((item, i) => (
                  <HighlightCard
                    key={item.id}
                    item={item}
                    index={i}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </div>
          )}
          {rankingItems.length > 0 && (
            <div>
              <h2 className="mb-4 text-xs font-bold tracking-[0.25em] text-pink-300/50 uppercase">
                Fabulous Ranking
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {rankingItems.map((item, i) => (
                  <RankingCard
                    key={item.id}
                    item={item}
                    rank={i + 1}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
