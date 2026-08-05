# 初期表示の遅延を切り分ける手順（一時的な計測用）

「初回表示までタブが10数秒ぐるぐるする」の再現有無と原因を特定するための計測キット。
**原因が特定できたら、下の「後片付け」に従って丸ごと削除すること。**

## 何を仕込んであるか

| 場所 | 出力先 | 分かること |
|---|---|---|
| `src/lib/timing.ts` | — | 計測ヘルパー本体 |
| `src/app/page.tsx` | `wrangler tail` | ホームの7本のクエリの、それぞれの所要時間 |
| `src/lib/supabase/middleware.ts` | `wrangler tail` | 認証判定の所要時間 |
| `src/app/api/health/route.ts` | ブラウザ / curl | Supabase が起きているか・応答 ms（ログイン不要） |
| `src/app/perf-logger.tsx` | ブラウザのコンソール | HTML が遅いのか JS/フォントが遅いのかの内訳 |
| `scripts/measure.sh` | ターミナル | 静的 / Worker / DB の3点を並べて計測 |

## 朝会の当日にやること

### 1. 朝会が始まる前（自分が最初のアクセス者になる）

ターミナルで:

```bash
./scripts/measure.sh
```

出力の `DB(Supabase)` を見る。

- **100ms 前後** → Supabase は起きている。原因は別
- **1秒前後** → 休眠から復帰した（既知の +1.1 秒）
- **10秒超 or 失敗** → **プロジェクトが一時停止していた。これが10数秒の正体**

### 2. サーバー側のログを流しっぱなしにする

別のターミナルで、朝会が終わるまで開いておく:

```bash
npx wrangler tail --format pretty
```

`[timing]` の行が出る。読み方:

```
[timing] middleware.auth 2ms path=/ session=あり     ← 認証。数msなら正常
[timing] home.today 95ms                            ← 個別のクエリ
[timing] home.ranking 98ms
[timing] home.batch(7本の並列クエリ全体) 110ms       ← ここが全体の待ち時間
```

- `home.batch` が **100〜200ms** → サーバーは正常。遅さの原因はブラウザ側
- `home.batch` が **数秒** → Supabase が詰まっている。個別の行を見てどのクエリか特定する
- そもそもログが出ない → リクエストが Worker に届いていない（ネットワーク・DNS 側）

### 3. 遅かった人のブラウザで確認してもらう

遅かった端末で **F12 → Console** を開いて再読み込み。`[perf]` の行が出る:

```
[perf]  HTML応答開始=120ms  HTML受信完了=350ms  DOM構築完了=800ms
        全読み込み完了=1200ms  リソース42件/1800KB  遅い順: xxx.js:600ms ...
```

判断:

- **HTML応答開始が大きい**（数秒）→ サーバー側。`wrangler tail` の `home.batch` と突き合わせる
- **HTML応答開始は速いのに全読み込み完了が10秒超** → JS/フォントの読み込み。`リソース○件/○KB` と `遅い順` に犯人が出る
- **リソースの KB が極端に大きい** → クライアントバンドルの削減が必要

### 4. 同時アクセスを再現したい場合

```bash
./scripts/measure.sh 15
```

15回連続で叩く。DB の数値が回を追うごとに悪化するなら、**同時接続数で詰まっている**。

## 判断早見表

| 症状 | 原因 | 対策 |
|---|---|---|
| `/api/health` が10秒超・失敗 | Supabase の一時停止 | 定期 ping で起こしておく / 有料プラン |
| `home.batch` が数秒 | Supabase の負荷・同時接続 | クエリ削減、接続数の見直し |
| `home.batch` は速いが `全読み込み完了` が遅い | JS/フォントが重い | バンドル削減、フォントの weight 削減 |
| Worker だけ 300ms 超が頻発 | isolate のコールドスタート | バンドル削減 |
| どれも正常値なのに遅い | 端末・回線側 | 端末の回線を確認 |

## 後片付け

原因が特定できたら以下を削除する:

```bash
rm src/lib/timing.ts src/app/perf-logger.tsx src/app/api/health/route.ts
rm scripts/measure.sh PERF_MEASUREMENT.md
```

加えて、以下から計測コードを外す:

- `src/app/page.tsx` … `timed(...)` の包みを外す
- `src/lib/supabase/middleware.ts` … `logTiming(...)` の行を削除
- `src/app/layout.tsx` … `<PerfLogger />` と import を削除
