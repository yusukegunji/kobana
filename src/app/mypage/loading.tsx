// マイページは画面中央寄せの狭いフォーム
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center" aria-busy="true">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="h-5 w-28 animate-pulse rounded bg-muted" />

        <div className="space-y-2">
          <div className="mx-auto h-8 w-48 animate-pulse rounded-md bg-muted" />
          <div className="mx-auto h-4 w-64 animate-pulse rounded bg-muted" />
        </div>

        <div className="space-y-4">
          {["メールアドレス", "表示名", "Slack User ID"].map((label) => (
            <div key={label} className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
            </div>
          ))}
          <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
        </div>

        <div className="pt-4">
          <div className="mx-auto h-8 w-24 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
