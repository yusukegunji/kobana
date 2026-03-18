"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { FacilitatorSchedule } from "@/lib/types";
import { upsertFacilitator, removeFacilitator } from "./actions";

interface Member {
  id: string;
  display_name: string;
}

// スケジュールマップ: date -> { userId, displayName }
interface ScheduleEntry {
  userId: string;
  displayName: string;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);
  return days;
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function CalendarView({
  initialSchedules,
  members,
}: {
  initialSchedules: FacilitatorSchedule[];
  members: Member[];
}) {
  const memberMap = new Map(members.map((m) => [m.id, m.display_name]));

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [scheduleMap, setScheduleMap] = useState<Record<string, ScheduleEntry>>(() => {
    const map: Record<string, ScheduleEntry> = {};
    for (const s of initialSchedules) {
      map[s.scheduled_date] = {
        userId: s.user_id,
        displayName: memberMap.get(s.user_id) ?? "不明",
      };
    }
    return map;
  });
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const days = getMonthDays(year, month);
  const todayStr = formatDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  function handlePrevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  }

  function handleNextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  }

  function handleAssign(date: string, userId: string) {
    const member = members.find((m) => m.id === userId);
    if (!member) return;

    startTransition(async () => {
      const result = await upsertFacilitator(date, userId);
      if (!result.error) {
        setScheduleMap((prev) => ({
          ...prev,
          [date]: { userId, displayName: member.display_name },
        }));
        setEditingDate(null);
      }
    });
  }

  function handleRemove(date: string) {
    startTransition(async () => {
      const result = await removeFacilitator(date);
      if (!result.error) {
        setScheduleMap((prev) => {
          const next = { ...prev };
          delete next[date];
          return next;
        });
        setEditingDate(null);
      }
    });
  }

  return (
    <div>
      {/* 月ナビゲーション */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevMonth}
          className="border-stone-700 bg-transparent text-stone-300 hover:bg-stone-800"
        >
          ←
        </Button>
        <h2 className="text-xl font-bold text-stone-100">
          {year}年 {month + 1}月
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          className="border-stone-700 bg-transparent text-stone-300 hover:bg-stone-800"
        >
          →
        </Button>
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {/* 曜日ヘッダー */}
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-2 text-center text-xs font-bold ${
              i === 0
                ? "text-red-400/70"
                : i === 6
                  ? "text-blue-400/70"
                  : "text-stone-500"
            }`}
          >
            {w}
          </div>
        ))}

        {/* 日付セル */}
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }

          const dateStr = formatDate(year, month, day);
          const assigned = scheduleMap[dateStr];
          const isToday = dateStr === todayStr;
          const isEditing = editingDate === dateStr;
          const dayOfWeek = new Date(year, month, day).getDay();

          return (
            <div
              key={dateStr}
              className={`relative min-h-[5rem] rounded-lg border p-1.5 transition-colors ${
                isToday
                  ? "border-amber-500/50 bg-amber-950/30"
                  : "border-stone-800 bg-stone-900/50 hover:border-stone-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    isToday
                      ? "text-amber-300"
                      : dayOfWeek === 0
                        ? "text-red-400/70"
                        : dayOfWeek === 6
                          ? "text-blue-400/70"
                          : "text-stone-400"
                  }`}
                >
                  {day}
                </span>
                {isToday && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                    TODAY
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="mt-1 flex flex-col gap-1">
                  <select
                    className="h-7 w-full rounded-md border border-stone-700 bg-stone-800 px-1.5 text-xs text-stone-200 outline-none"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) handleAssign(dateStr, e.target.value);
                    }}
                    disabled={isPending}
                  >
                    <option value="" disabled>
                      担当を選択
                    </option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.display_name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    {assigned && (
                      <button
                        onClick={() => handleRemove(dateStr)}
                        disabled={isPending}
                        className="text-[10px] text-red-400/70 hover:text-red-300"
                      >
                        解除
                      </button>
                    )}
                    <button
                      onClick={() => setEditingDate(null)}
                      className="text-[10px] text-stone-500 hover:text-stone-300"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingDate(dateStr)}
                  className="mt-1 w-full text-left"
                >
                  {assigned ? (
                    <span className="inline-block rounded-md bg-emerald-900/50 px-1.5 py-0.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-800/50">
                      {assigned.displayName}
                    </span>
                  ) : (
                    <span className="inline-block rounded-md px-1.5 py-0.5 text-xs text-stone-600 transition-colors hover:bg-stone-800 hover:text-stone-400">
                      + 担当
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
