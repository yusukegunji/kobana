---
description: Supabase の使い方ルール
globs: "src/**/*.{ts,tsx}"
---

# Supabase ルール

- サーバー側（Server Components, Server Actions, middleware）では `@/lib/supabase/server` の `createClient()` を使う
- クライアント側（`"use client"` コンポーネント）では `@/lib/supabase/client` の `createBrowserClient()` を使う
- Realtime サブスクリプションは `@/lib/supabase/realtime` のカスタムフックを使う
- RLS が有効。新テーブル追加時は必ず RLS ポリシーを定義する
- スキーマ変更は `supabase/schema.sql` に追記し、マイグレーション手順を残す
- `.env.local` の Supabase URL/Key をコードにハードコードしない
