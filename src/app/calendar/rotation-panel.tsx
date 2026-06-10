"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface Member {
  id: string;
  display_name: string;
}

interface PlanEntry {
  date: string;
  userId: string;
}

type DaysOffMap = Record<string, Set<string>>;

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function buildPlan(
  order: string[],
  year: number,
  month: number,
  options: {
    weekdaysOnly: boolean;
    skipDaysOff: boolean;
    overwrite: boolean;
  },
  daysOffMap: DaysOffMap,
  assignedDates: Set<string>,
): PlanEntry[] {
  if (order.length === 0) return [];

  const lastDay = new Date(year, month + 1, 0).getDate();
  const targetDates: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const dow = new Date(year, month, d).getDay();
    if (options.weekdaysOnly && (dow === 0 || dow === 6)) continue;
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
    if (!options.overwrite && assignedDates.has(dateStr)) continue;
    targetDates.push(dateStr);
  }

  const plan: PlanEntry[] = [];
  let ptr = 0;
  for (const date of targetDates) {
    let userId = order[ptr];
    // 休みの人をスキップ（全員休みなら順番どおり割当）
    for (let tries = 0; tries < order.length; tries++) {
      const candidate = order[(ptr + tries) % order.length];
      const off = options.skipDaysOff && (daysOffMap[date]?.has(candidate) ?? false);
      if (!off) {
        userId = candidate;
        ptr = (ptr + tries + 1) % order.length;
        break;
      }
      if (tries === order.length - 1) {
        ptr = (ptr + 1) % order.length;
      }
    }
    plan.push({ date, userId });
  }
  return plan;
}

export function RotationPanel({
  members,
  year,
  month,
  daysOffMap,
  assignedDates,
  isPending,
  onApply,
}: {
  members: Member[];
  year: number;
  month: number;
  daysOffMap: DaysOffMap;
  assignedDates: Set<string>;
  isPending: boolean;
  onApply: (plan: PlanEntry[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);
  const [skipDaysOff, setSkipDaysOff] = useState(true);
  const [overwrite, setOverwrite] = useState(false);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m.display_name])),
    [members],
  );

  const plan = useMemo(
    () =>
      buildPlan(
        order,
        year,
        month,
        { weekdaysOnly, skipDaysOff, overwrite },
        daysOffMap,
        assignedDates,
      ),
    [order, year, month, weekdaysOnly, skipDaysOff, overwrite, daysOffMap, assignedDates],
  );

  function toggleMember(id: string) {
    setOrder((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (!open) {
    return (
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="border-stone-700 bg-transparent text-stone-300 hover:bg-stone-800"
        >
          🔄 {year}年{month + 1}月を自動割当
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-stone-800 bg-stone-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-100">
          ローテーション自動割当（{year}年{month + 1}月）
        </h3>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-stone-500 hover:text-stone-300"
        >
          閉じる
        </button>
      </div>

      {/* メンバー選択（クリック順がローテーション順） */}
      <p className="mb-1.5 text-xs text-stone-500">
        メンバーをクリックして順番を決めます
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {members.map((m) => {
          const idx = order.indexOf(m.id);
          const selected = idx >= 0;
          return (
            <button
              key={m.id}
              onClick={() => toggleMember(m.id)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                selected
                  ? "bg-emerald-900/60 text-emerald-200"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              }`}
            >
              {selected && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/40 text-[10px] font-bold">
                  {idx + 1}
                </span>
              )}
              {m.display_name}
            </button>
          );
        })}
      </div>

      {/* オプション */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-300">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={weekdaysOnly}
            onChange={(e) => setWeekdaysOnly(e.target.checked)}
          />
          平日のみ
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={skipDaysOff}
            onChange={(e) => setSkipDaysOff(e.target.checked)}
          />
          休み登録日をスキップ
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
          />
          既存の割当も上書き
        </label>
      </div>

      {/* プレビュー */}
      {order.length > 0 && (
        <div className="mb-3 max-h-40 overflow-y-auto rounded-md border border-stone-800 bg-stone-950/50 p-2">
          {plan.length === 0 ? (
            <p className="text-xs text-stone-500">割当対象の日がありません</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 sm:grid-cols-3">
              {plan.map((p) => {
                const d = Number(p.date.slice(8, 10));
                const dow = new Date(year, month, d).getDay();
                return (
                  <span key={p.date} className="text-xs text-stone-400">
                    {month + 1}/{d}({WEEKDAY_LABELS[dow]}){" "}
                    <span className="text-emerald-300">
                      {memberMap.get(p.userId) ?? "不明"}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          disabled={isPending || plan.length === 0}
          onClick={() => onApply(plan)}
          className="bg-emerald-700 text-white hover:bg-emerald-600"
        >
          {isPending ? "割当中..." : `${plan.length}日分を割当`}
        </Button>
        {order.length > 0 && (
          <button
            onClick={() => setOrder([])}
            className="text-xs text-stone-500 hover:text-stone-300"
          >
            選択をクリア
          </button>
        )}
      </div>
    </div>
  );
}
