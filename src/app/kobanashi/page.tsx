import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase/server";
import type { Kobanashi, KobanashiStatus } from "@/lib/types";
import { KobanashiTable } from "./_components/kobanashi-table";
import { LinkButton } from "./_components/link-button";
import { LogoutButton } from "./_components/logout-button";
import { StatusFilter } from "./_components/status-filter";

export default async function KobanashiListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from("kobanashi")
    .select("*")
    .order("scheduled_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status as KobanashiStatus);
  }

  const { data, error } = await query;

  if (error) {
    return <p className="p-8 text-destructive">データの取得に失敗しました: {error.message}</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LinkButton href="/" variant="ghost" size="sm">ホーム</LinkButton>
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <StatusFilter />
          </Suspense>
          <LinkButton href="/kobanashi/new">新規作成</LinkButton>
          <LinkButton href="/calendar" variant="ghost" size="sm">カレンダー</LinkButton>
          <LinkButton href="/mypage" variant="ghost" size="sm">マイページ</LinkButton>
          <LogoutButton />
        </div>
      </div>
      <KobanashiTable data={(data as Kobanashi[]) ?? []} />
    </div>
  );
}
