"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { isActiveMember } from "@/lib/member-status";
import type { MemberRow } from "@/lib/types";
import {
  setMemberExclusion,
  setMemberLeftAt,
  type MemberExclusionField,
} from "./actions";
import { MemberListRow } from "./member-row";

// 退職日の設定・解除と、在籍したまま候補から外す操作をまとめたパネル。
export function MemberPanel({
  allMembers,
  today,
}: {
  allMembers: MemberRow[];
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<MemberRow[]>(allMembers);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 在籍中を先に、その中では表示名順（元の並び）を保つ
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const activeA = isActiveMember(a.left_at, today);
        const activeB = isActiveMember(b.left_at, today);
        if (activeA === activeB) return 0;
        return activeA ? -1 : 1;
      }),
    [rows, today],
  );

  // Server Action を呼び、成功したら手元の行だけ更新する（既存の楽観更新に合わせる）
  function apply(
    userId: string,
    patch: Partial<MemberRow>,
    action: () => Promise<{ error: string | null }>,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      setRows((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, ...patch } : m)),
      );
    });
  }

  function handleSetLeftAt(userId: string, leftAt: string | null) {
    apply(userId, { left_at: leftAt }, () => setMemberLeftAt(userId, leftAt));
  }

  function handleToggleExclusion(
    userId: string,
    field: MemberExclusionField,
    excluded: boolean,
  ) {
    apply(userId, { [field]: excluded }, () =>
      setMemberExclusion(userId, field, excluded),
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
          👥 メンバー管理
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-stone-800 bg-stone-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-100">メンバー管理</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-stone-500 hover:text-stone-300"
        >
          閉じる
        </button>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-stone-500">
        チェックを外すとその候補から外れます。「発表者候補」を外すと、ルーレット・指名に加えて
        聴衆カウントとそれ正解の回答母数からも外れます。
        <br />
        退職日を設定すると、その日を最後にすべての候補から外れます。過去の担当履歴や投票者名は残ります。
      </p>

      {error && (
        <p className="mb-3 rounded-md bg-red-950/40 px-2 py-1.5 text-xs text-red-300">
          {error}
        </p>
      )}

      <ul className="divide-y divide-stone-800/80">
        {sorted.map((m) => (
          <MemberListRow
            key={m.id}
            member={m}
            today={today}
            isPending={isPending}
            onSetLeftAt={handleSetLeftAt}
            onToggleExclusion={handleToggleExclusion}
          />
        ))}
      </ul>
    </div>
  );
}
