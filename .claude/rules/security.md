---
description: セキュリティチェックリスト
globs: "**/*.{ts,tsx}"
---

# セキュリティ

- Server Actions の入力は必ずバリデーションする
- ユーザー入力を直接 SQL に埋め込まない（Supabase クライアントのパラメータバインディングを使う）
- 認証チェック: Server Actions の先頭で `supabase.auth.getUser()` を呼び、未認証なら早期リターン
- 環境変数・APIキー・シークレットをコミットしない
- `dangerouslySetInnerHTML` は使わない
