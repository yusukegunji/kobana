// 初期表示の遅延切り分け用の計測ヘルパー。原因が特定できたら丸ごと削除する。
//
// 出力は `npx wrangler tail` で見る。Cloudflare Workers の時計は I/O のたびにしか
// 進まないため、CPU 時間は 0ms に見える。ここで測りたいのは Supabase への待ち時間
// （= I/O）なので、この制約は問題にならない。

export async function timed<T>(label: string, work: PromiseLike<T>): Promise<T> {
  const start = Date.now();
  try {
    return await work;
  } finally {
    console.log(`[timing] ${label} ${Date.now() - start}ms`);
  }
}

export function logTiming(label: string, ms: number, extra?: string): void {
  console.log(`[timing] ${label} ${ms}ms${extra ? ` ${extra}` : ""}`);
}
