# Kobana - 小噺管理アプリ

## プロジェクト概要

朝会で発表する小噺（こばなし）を管理する Web アプリケーション。
リアルタイム同期、ルーレットによる登壇者選出、ファビュラス（いいね）機能を備える。

## テックスタック

- **フレームワーク**: Next.js 16 (App Router) + React 19
- **言語**: TypeScript 5 (strict mode)
- **スタイル**: Tailwind CSS 4 + shadcn/ui (base-nova)
- **DB/Auth**: Supabase (PostgreSQL + Auth + Realtime)
- **アニメーション**: CSS のみ（Three.js は未使用のため依存から削除済み）
- **デプロイ**: Cloudflare Workers (OpenNext)

## コマンド

```bash
npm run dev       # 開発サーバー起動
npm run build     # プロダクションビルド
npm run lint      # ESLint 実行
npm run preview   # Cloudflare プレビュー
npm run deploy    # Cloudflare デプロイ
```

## ディレクトリ構成

```
src/
  app/                    # Next.js App Router ページ
    page.tsx              # ホーム（ステージ）のデータ取得
    loading.tsx           # ホームのスケルトン（取得完了前にシェルを流す）
    home-stage.tsx        # ホームのクライアント側ルート
    _stage/               # ホーム専用の UI 部品（ルーレット・投票・レール等）
    kobanashi/            # 小噺 CRUD（メイン機能）
    calendar/             # ファシリテーター予定表
    seikai/               # それ正解（お題一斉回答ゲーム）
    login/                # 認証
    mypage/               # プロフィール設定
  components/
    ui/                   # shadcn/ui コンポーネント
  lib/
    types.ts              # 型定義
    constants.ts          # ステータス定数
    supabase/             # Supabase クライアント (server/client/middleware/realtime)
supabase/
  schema.sql              # DBスキーマ（テーブル定義、RLS、トリガー）
  migration_*.sql         # 機能追加ごとのマイグレーション（SQL Editor で手動実行）
```

## アーキテクチャ方針

- Server Components をデフォルトとし、インタラクティブな部分のみ `"use client"`
- データ取得・変更は Server Actions (`actions.ts`) で行う
- パスエイリアス: `@/*` → `./src/*`
- Supabase クライアントは `@/lib/supabase/server` (サーバー側) と `@/lib/supabase/client` (クライアント側) を使い分ける
- Realtime は `@/lib/supabase/realtime` のカスタムフック経由

## パフォーマンス方針

Cloudflare Workers → Supabase の1往復は約100ms。ここが初期表示のほぼ全てを決める。

- **Server Component 内のクエリを `await` で直列に並べない。** 互いに依存しないものは必ず `Promise.all` でまとめる（往復回数がそのまま TTFB に積み上がる）
- 親子関係のあるデータは PostgREST の埋め込み取得（`select("*, child(col)")`）で1往復にまとめる
- 認証ユーザーの判定は `auth.getUser()`（毎回 Auth API へ往復）ではなく `auth.getClaims()`（JWT をローカル検証）を使う。プロジェクトは ES256 の非対称鍵なので実際に往復が発生しない
  - ただし Server Actions の認可チェックは失効を確実に見るため `getUser()` のままにする
- 動的ページには `loading.tsx` を置き、データ取得完了前にシェルを流す

## データベース

- **kobanashi**: 小噺（title, speaker, status, notes, scheduled_date, duration）
- **profiles**: ユーザープロフィール（auth.users と 1:1）
- **facilitator_schedule**: 日別ファシリテーター担当
- **kobanashi_fabulous**: いいね（kobanashi_id + user_id でユニーク）
- **current_onair**: 現在放映中の小噺（Realtime 対象）
- **polls / poll_options / poll_votes**: ライブ投票（Realtime 対象）
- **seikai_games / seikai_answers**: それ正解（Realtime 対象）。締切前は RLS で自分の回答しか読めない

ステータス enum: `未対応` | `対応済` | `凍結` | `対応不要`

## コーディング規約

- UI コンポーネント追加時は `npx shadcn add <component>` を使う
- 環境変数は `.env.local` に置き、`NEXT_PUBLIC_` プレフィックスで公開する
- コミットメッセージは日本語可、Conventional Commits 形式推奨（`feat:`, `fix:`, `chore:` など）
- 不要な console.log は残さない
