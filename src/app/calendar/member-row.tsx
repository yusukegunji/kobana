"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { isActiveMember } from "@/lib/member-status";
import type { MemberRow } from "@/lib/types";
import type { MemberExclusionField } from "./actions";

// メンバー管理パネルの1行。退職日の設定と、候補からの除外トグルを持つ。
export function MemberListRow({
  member,
  today,
  isPending,
  onSetLeftAt,
  onToggleExclusion,
}: {
  member: MemberRow;
  today: string;
  isPending: boolean;
  onSetLeftAt: (userId: string, leftAt: string | null) => void;
  onToggleExclusion: (
    userId: string,
    field: MemberExclusionField,
    excluded: boolean,
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftDate, setDraftDate] = useState(today);
  const active = isActiveMember(member.left_at, today);

  return (
    <li className="py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${active ? "text-stone-200" : "text-stone-500"}`}
          >
            {member.display_name}
          </span>
          {member.left_at && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                active
                  ? "bg-amber-950/50 text-amber-300/90"
                  : "bg-stone-800 text-stone-400"
              }`}
            >
              {active ? "退職予定" : "退職済み"} {member.left_at}
            </span>
          )}
        </div>

        {member.left_at ? (
          <button
            onClick={() => onSetLeftAt(member.id, null)}
            disabled={isPending}
            className="text-xs text-emerald-400/80 hover:text-emerald-300 disabled:opacity-50"
          >
            在籍に戻す
          </button>
        ) : (
          !editing && (
            <button
              onClick={() => {
                setDraftDate(today);
                setEditing(true);
              }}
              disabled={isPending}
              className="text-xs text-stone-400 hover:text-stone-200 disabled:opacity-50"
            >
              退職日を設定
            </button>
          )
        )}
      </div>

      {/* 在籍中の人だけ、候補への出し入れを操作できる */}
      {active && (
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-400">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={!member.exclude_from_speaker}
              disabled={isPending}
              onChange={(e) =>
                onToggleExclusion(
                  member.id,
                  "exclude_from_speaker",
                  !e.target.checked,
                )
              }
            />
            発表者候補
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={!member.exclude_from_facilitator}
              disabled={isPending}
              onChange={(e) =>
                onToggleExclusion(
                  member.id,
                  "exclude_from_facilitator",
                  !e.target.checked,
                )
              }
            />
            ファシリテーター候補
          </label>
        </div>
      )}

      {editing && (
        <div className="mt-2 rounded-md border border-stone-800 bg-stone-950/60 p-2">
          <p className="mb-2 text-[11px] text-amber-300/80">
            この日の翌日以降のファシリテーター担当は自動で外れます（在籍に戻しても復元されません）。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="h-7 rounded-md border border-stone-700 bg-stone-800 px-1.5 text-xs text-stone-200 outline-none"
            />
            <Button
              size="sm"
              disabled={isPending || !draftDate}
              onClick={() => {
                onSetLeftAt(member.id, draftDate);
                setEditing(false);
              }}
              className="h-7 bg-amber-700 text-xs text-white hover:bg-amber-600"
            >
              {isPending ? "設定中..." : "退職にする"}
            </Button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-stone-500 hover:text-stone-300"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
