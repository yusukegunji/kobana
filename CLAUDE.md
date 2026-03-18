# Kobana - 小噺管理アプリ

## プロジェクト概要

朝会で発表する小噺（こばなし）を管理する Web アプリケーション。
リアルタイム同期、3D ダイスによるファシリテーター選出、ファビュラス（いいね）機能を備える。

## テックスタック

- **フレームワーク**: Next.js 16 (App Router) + React 19
- **言語**: TypeScript 5 (strict mode)
- **スタイル**: Tailwind CSS 4 + shadcn/ui (base-nova)
- **DB/Auth**: Supabase (PostgreSQL + Auth + Realtime)
- **3D**: Three.js + React Three Fiber + Drei
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
    kobanashi/            # 小噺 CRUD（メイン機能）
    calendar/             # ファシリテーター予定表
    login/                # 認証
    mypage/               # プロフィール設定
  components/
    ui/                   # shadcn/ui コンポーネント
    dice-3d.tsx           # 3D 八面体ダイス
    stage-background.tsx  # 3D 背景アニメーション
    confetti-burst.tsx    # 紙吹雪エフェクト
  lib/
    types.ts              # 型定義
    constants.ts          # ステータス定数
    supabase/             # Supabase クライアント (server/client/middleware/realtime)
supabase/
  schema.sql              # DBスキーマ（テーブル定義、RLS、トリガー）
  migration_realtime.sql  # Realtime マイグレーション
```

## アーキテクチャ方針

- Server Components をデフォルトとし、インタラクティブな部分のみ `"use client"`
- データ取得・変更は Server Actions (`actions.ts`) で行う
- パスエイリアス: `@/*` → `./src/*`
- Supabase クライアントは `@/lib/supabase/server` (サーバー側) と `@/lib/supabase/client` (クライアント側) を使い分ける
- Realtime は `@/lib/supabase/realtime` のカスタムフック経由

## データベース

- **kobanashi**: 小噺（title, speaker, status, notes, scheduled_date, duration）
- **profiles**: ユーザープロフィール（auth.users と 1:1）
- **facilitator_schedule**: 日別ファシリテーター担当
- **kobanashi_fabulous**: いいね（kobanashi_id + user_id でユニーク）
- **current_onair**: 現在放映中の小噺（Realtime 対象）

ステータス enum: `未対応` | `対応済` | `凍結` | `対応不要`

## コーディング規約

- UI コンポーネント追加時は `npx shadcn add <component>` を使う
- 環境変数は `.env.local` に置き、`NEXT_PUBLIC_` プレフィックスで公開する
- コミットメッセージは日本語可、Conventional Commits 形式推奨（`feat:`, `fix:`, `chore:` など）
- 不要な console.log は残さない
