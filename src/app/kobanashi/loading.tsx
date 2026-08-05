// ダッシュボードは 6 列のテーブルなので、ヘッダー行 + 行リストの骨組みにする
const COLUMNS = 6;
const ROWS = 8;

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8" aria-busy="true">
      {/* ヘッダー行 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      {/* テーブル */}
      <div className="w-full">
        <div className="grid grid-cols-6 gap-4 border-b py-3">
          {Array.from({ length: COLUMNS }, (_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" />
          ))}
        </div>
        {Array.from({ length: ROWS }, (_, row) => (
          <div key={row} className="grid grid-cols-6 gap-4 border-b py-4">
            {Array.from({ length: COLUMNS }, (_, col) => (
              <div key={col} className="h-4 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
