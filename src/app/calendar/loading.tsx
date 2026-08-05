const WEEK_CELLS = 35;

// カレンダーは月ナビ + ローテーションパネル + 7列グリッドという専用レイアウト
export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-950" aria-busy="true">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* ヘッダー行 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-20 animate-pulse rounded-md bg-stone-800" />
            <div className="h-8 w-72 animate-pulse rounded-md bg-stone-800" />
          </div>
          <div className="h-8 w-28 animate-pulse rounded-md bg-stone-800" />
        </div>

        {/* 月ナビゲーション */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <div className="h-8 w-10 animate-pulse rounded-md bg-stone-800" />
          <div className="h-7 w-40 animate-pulse rounded-md bg-stone-800" />
          <div className="h-8 w-10 animate-pulse rounded-md bg-stone-800" />
        </div>

        {/* ローテーション自動割当パネル */}
        <div className="mb-6 h-24 animate-pulse rounded-lg border border-stone-800 bg-stone-900/50" />

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: WEEK_CELLS }, (_, i) => (
            <div
              key={i}
              className="min-h-20 animate-pulse rounded-lg border border-stone-800 bg-stone-900/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
