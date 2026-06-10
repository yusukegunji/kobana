"use client";

import { useState, useCallback } from "react";
import type { Kobanashi, KobanashiWithFabulous } from "@/lib/types";
import { useRealtimeOnAir } from "@/lib/supabase/realtime";
import {
  startOnAir,
  createAndStartOnAir,
} from "./kobanashi/_components/onair-action";
import { AppBar } from "./_stage/app-bar";
import { StockRail } from "./_stage/stock-rail";
import { OnAirHero, SelectHero, TalkList } from "./_stage/speaker-hero";
import { SideRail } from "./_stage/side-rail";
import { LivePoll } from "./_stage/live-poll";

interface Toast {
  id: string;
  msg: string;
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);
  return [toasts, push] as const;
}

interface HomeStageProps {
  todayItems: KobanashiWithFabulous[];
  recentItems: KobanashiWithFabulous[];
  allItems: Kobanashi[];
  allUserNames: string[];
  todayFacilitator: string | null;
  isFacilitator: boolean;
  rankingItems: KobanashiWithFabulous[];
  currentUserId: string | null;
}

export function HomeStage({
  todayItems,
  recentItems,
  allItems,
  allUserNames,
  todayFacilitator,
  isFacilitator,
  rankingItems,
  currentUserId,
}: HomeStageProps) {
  const { onAir } = useRealtimeOnAir();
  const [toasts, pushToast] = useToasts();
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  // 登壇開始直後はサーバーの再取得が間に合わず todayItems/allItems に該当小噺が
  // 無いため、クライアントで作成・選択した小噺を一時的に保持してフォールバックに使う
  const [optimisticOnAir, setOptimisticOnAir] =
    useState<KobanashiWithFabulous | null>(null);

  // リアルタイムの On Air 状態から該当する小噺を導出
  const onAirItem: KobanashiWithFabulous | null = (() => {
    if (!onAir) return null;
    const fromToday = todayItems.find((i) => i.id === onAir.kobanashi_id);
    if (fromToday) return fromToday;
    const fromAll = allItems.find((i) => i.id === onAir.kobanashi_id);
    if (fromAll) return { ...fromAll, fabulous_count: 0, has_fabuloused: false };
    // サーバー再取得前のフォールバック（onAir と ID が一致する場合のみ）
    if (optimisticOnAir && optimisticOnAir.id === onAir.kobanashi_id) {
      return optimisticOnAir;
    }
    return null;
  })();

  const waitingItems = todayItems.filter((item) => !item.published_at);
  const doneItems = todayItems.filter((item) => item.published_at);

  const filteredStock = selectedSpeaker
    ? allItems.filter((item) => item.speaker === selectedSpeaker)
    : allItems;

  const hasStock = useCallback(
    (name: string) => allItems.some((item) => item.speaker === name),
    [allItems],
  );

  const handleStockPick = useCallback(
    (item: Kobanashi) => {
      // 選択した小噺はその場で分かるので即座にフォールバック表示用に保持
      setOptimisticOnAir({ ...item, fabulous_count: 0, has_fabuloused: false });
      startOnAir(item.id);
      pushToast("🎤 " + item.speaker + " さんが登壇しました");
    },
    [pushToast],
  );

  const handleFreeTalk = useCallback(
    (name: string) => {
      pushToast("🎤 " + name + " さんのフリートークを開始しました");
      // 作成された小噺の ID はサーバー応答で初めて分かるため、戻り値を待って保持する
      createAndStartOnAir(name).then((res) => {
        if (res.item) {
          setOptimisticOnAir({
            ...res.item,
            fabulous_count: 0,
            has_fabuloused: false,
          });
        }
      });
    },
    [pushToast],
  );

  const handleRolled = useCallback(
    (name: string) => {
      pushToast("🎲 " + name + " さんに決定！");
    },
    [pushToast],
  );

  const handleNominated = useCallback(
    (name: string) => {
      pushToast("👈 " + name + " さんを指名しました");
    },
    [pushToast],
  );

  return (
    <div className="koba-stage">
      <AppBar onAirSpeaker={onAirItem ? onAirItem.speaker : null} />

      <main className="stage-wrap">
        <div className="grid">
          <StockRail
            items={filteredStock}
            selectedSpeaker={selectedSpeaker}
            disabled={!!onAirItem}
            onPick={handleStockPick}
            onClearSpeaker={() => setSelectedSpeaker(null)}
          />

          <section className="block-stage">
            {onAirItem ? (
              <OnAirHero
                item={onAirItem}
                facilitator={todayFacilitator}
                currentUserId={currentUserId}
                startedAt={onAir?.started_at}
              />
            ) : (
              <SelectHero
                names={allUserNames}
                facilitator={todayFacilitator}
                canRoll={isFacilitator && allUserNames.length > 0}
                hasStock={hasStock}
                onShowStock={setSelectedSpeaker}
                onFreeTalk={handleFreeTalk}
                onRolled={handleRolled}
                onNominated={handleNominated}
              />
            )}
            <TalkList
              waiting={waitingItems}
              done={doneItems}
              onStart={handleStockPick}
              startDisabled={!!onAirItem}
              currentUserId={currentUserId}
            />
          </section>

          <LivePoll
            currentUserId={currentUserId}
            audienceCount={allUserNames.length}
            kobanashiId={onAirItem ? onAirItem.id : null}
            pushToast={pushToast}
          />

          <SideRail
            highlights={recentItems}
            ranking={rankingItems}
            currentUserId={currentUserId}
          />
        </div>
      </main>

      <div className="koba-toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className="koba-toast">
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
