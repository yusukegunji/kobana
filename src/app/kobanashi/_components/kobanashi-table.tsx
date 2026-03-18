"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Kobanashi } from "@/lib/types";
import { useRealtimeOnAir } from "@/lib/supabase/realtime";
import { startOnAir } from "./onair-action";
import { OnAirBar } from "./onair-bar";
import { StatusBadge } from "./status-badge";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

function formatDuration(minutes: number | null) {
  if (minutes == null) return "-";
  return `${minutes}分`;
}

export function KobanashiTable({ data }: { data: Kobanashi[] }) {
  const { onAir } = useRealtimeOnAir();

  // リアルタイムのOn Air状態からonAirItemを導出
  const onAirItem = (() => {
    if (!onAir) return null;
    const found = data.find((i) => i.id === onAir.kobanashi_id);
    if (found) return { id: found.id, title: found.title };
    return { id: onAir.kobanashi_id, title: "" };
  })();

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        小噺がまだ登録されていません。
      </p>
    );
  }

  return (
    <>
      {onAirItem && (
        <OnAirBar
          itemId={onAirItem.id}
          itemTitle={onAirItem.title}
          onStop={() => {}}
          startedAt={onAir?.started_at}
        />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>タイトル</TableHead>
            <TableHead>話し手</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>予定日</TableHead>
            <TableHead>所要時間</TableHead>
            <TableHead>記載日</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              className={onAirItem?.id === item.id ? "bg-red-950/30" : ""}
            >
              <TableCell>
                {!item.published_at && !onAirItem && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => startOnAir(item.id)}
                  >
                    On Air
                  </Button>
                )}
                {onAirItem?.id === item.id && (
                  <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                )}
              </TableCell>
              <TableCell>
                <Link
                  href={`/kobanashi/${item.id}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {item.title}
                </Link>
              </TableCell>
              <TableCell>{item.speaker}</TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell>{formatDate(item.scheduled_date)}</TableCell>
              <TableCell>{formatDuration(item.duration)}</TableCell>
              <TableCell>{formatDate(item.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
