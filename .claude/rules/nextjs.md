---
description: Next.js App Router のパターン
globs: "src/app/**/*.{ts,tsx}"
---

# Next.js App Router ルール

- Server Components をデフォルトとする。`useState`, `useEffect`, イベントハンドラが必要な場合のみ `"use client"` を付ける
- データ取得は Server Components 内で直接 `await` する。クライアントから fetch しない
- データ変更は Server Actions (`"use server"` 付きの関数) で行う。各ルートの `actions.ts` に配置する
- `page.tsx` はルーティングとデータ取得に専念し、UIロジックは別コンポーネントに切り出す
- レイアウト共有は `layout.tsx` で行い、ページ間で重複するUIを避ける
- `redirect()` は Server Actions / Server Components 内でのみ使う
- Metadata は `generateMetadata` または静的 `metadata` オブジェクトで定義する
