// 編集ページは 1 カラムのフォーム（タイトル / ステータス / 予定日 / 備考）
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8" aria-busy="true">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      <div className="space-y-6">
        {[
          "h-9", // タイトル
          "h-9", // ステータス
          "h-9", // 予定日
          "h-24", // 備考
        ].map((height, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className={`${height} w-full animate-pulse rounded-md bg-muted`} />
          </div>
        ))}
        <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
