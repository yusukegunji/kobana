# King of Time 連携プラン

## 背景・課題

現在の有休申請フローが4ステップに分散している:

1. Slack ワークフローで投稿
2. King of Time で有休設定
3. Outlook カレンダーに休登録
4. Spread Sheet に記載

**ゴール**: Kobana のカレンダーで休を設定するだけで、Slack + King of Time + Spread Sheet への連携が自動完了する。
（Outlook 連携は将来対応）

## 現状の実装

### 既存フロー（`src/app/calendar/actions.ts`）

- `submitDayOffRequest()` で有休申請を処理
- DB（`user_days_off`）に保存
- Slack Webhook で申請内容を投稿（オプション）
- 入力項目: 取得日、全日/半日、取得日数、上長承認

### DB スキーマ（`user_days_off`）

- `user_id`, `off_date` のみ保存（off_type, off_days は未保存）

---

## King of Time API 概要

- **ベース URL**: `https://api.kingtime.jp/v1/`
- **認証**: `Authorization: Bearer {APIトークン}`
- **トークン発行**: 管理画面 > 設定 > API連携
- **ドキュメント**: https://developer.kingtime.jp/

### 関連エンドポイント

| エンドポイント | メソッド | 用途 |
|---|---|---|
| `/daily-schedules/{date}` | GET/PUT | 日別スケジュール取得・変更 |
| `/employees` | GET | 従業員一覧（社員番号取得） |
| `/employees/{employeeKey}/time-cards/{date}` | PUT | 個別勤怠データ更新 |

### 認証・権限の前提条件

- [ ] King of Time の API オプションが契約に含まれているか確認
- [ ] 管理者 API トークンが発行可能か確認
- [ ] API トークンのスコープ（勤怠編集権限）が十分か確認

---

## 実装プラン

### Phase 1: 基盤整備

#### 1-1. DB スキーマ拡張

`user_days_off` テーブルに不足カラムを追加:

```sql
ALTER TABLE user_days_off
  ADD COLUMN off_type text NOT NULL DEFAULT '全日',        -- '全日' | '半日'
  ADD COLUMN off_days numeric(2,1) NOT NULL DEFAULT 1.0,   -- 0.5, 1, 1.5, ...
  ADD COLUMN approval text NOT NULL DEFAULT '未',           -- '未' | '済'
  ADD COLUMN kot_synced boolean NOT NULL DEFAULT false,     -- KoT連携済みフラグ
  ADD COLUMN kot_error text,                                -- KoT連携エラー内容
  ADD COLUMN sheet_synced boolean NOT NULL DEFAULT false,   -- Spread Sheet連携済みフラグ
  ADD COLUMN sheet_error text;                              -- Spread Sheet連携エラー内容
```

#### 1-2. profiles テーブルに King of Time 社員番号を追加

```sql
ALTER TABLE profiles
  ADD COLUMN kot_employee_key text;  -- King of Time の従業員キー
```

#### 1-3. 環境変数

```env
KOT_API_TOKEN=xxxx           # King of Time API トークン
KOT_API_BASE_URL=https://api.kingtime.jp/v1
GOOGLE_SERVICE_ACCOUNT_KEY=xxxx  # Google サービスアカウント JSON キー
GOOGLE_SPREADSHEET_ID=xxxx       # 有休管理 Spread Sheet の ID
```

### Phase 2: King of Time API クライアント実装

#### 2-1. API クライアント (`src/lib/king-of-time/client.ts`)

```typescript
// 主な関数
export async function getEmployee(employeeKey: string): Promise<Employee>
export async function registerDayOff(params: {
  employeeKey: string
  date: string          // YYYY-MM-DD
  type: '全日' | '半日'
}): Promise<KotResult>
export async function cancelDayOff(params: {
  employeeKey: string
  date: string
}): Promise<KotResult>
```

#### 2-2. エラーハンドリング

- API トークン期限切れ → ユーザーに管理者連絡を促すメッセージ
- レート制限 → リトライ（最大3回、exponential backoff）
- ネットワークエラー → DB に `kot_synced=false` で記録、後から再試行可能に

### Phase 2.5: Spread Sheet API クライアント実装

#### 2.5-1. API クライアント (`src/lib/google-sheets/client.ts`)

```typescript
// Google Sheets API (googleapis) を使用
export async function appendDayOffRow(params: {
  name: string           // 社員名
  date: string           // YYYY-MM-DD
  type: '全日' | '半日'
  days: number           // 取得日数
}): Promise<SheetResult>
export async function removeDayOffRow(params: {
  name: string
  date: string
}): Promise<SheetResult>
```

#### 2.5-2. エラーハンドリング

- 認証エラー → サービスアカウントキーの確認を促す
- シート未共有 → 管理者にシート共有を依頼するメッセージ
- ネットワークエラー → DB に `sheet_synced=false` で記録、後から再試行可能に

### Phase 3: Server Action 統合

#### 3-1. `submitDayOffRequest` の拡張

```
有休申請送信
  ├─ DB に保存（off_type, off_days, approval も保存）
  ├─ Slack に投稿（既存、オプション）
  ├─ King of Time に登録（新規）
  │    ├─ 成功 → kot_synced = true
  │    └─ 失敗 → kot_synced = false, kot_error に記録
  └─ Spread Sheet に記載（新規）
       ├─ 成功 → sheet_synced = true
       └─ 失敗 → sheet_synced = false, sheet_error に記録
```

#### 3-2. `removeDayOff` の拡張

- 休みを削除する際に King of Time 側も取り消す

#### 3-3. 再同期アクション（新規）

```typescript
export async function resyncDayOff(offId: string): Promise<Result>
```

- `kot_synced=false` または `sheet_synced=false` のレコードを手動で再連携

### Phase 4: UI 拡張

#### 4-1. マイページに King of Time 社員番号設定

- `src/app/mypage/` に KoT 社員番号の入力フィールドを追加
- profiles テーブルの `kot_employee_key` に保存

#### 4-2. カレンダー上の同期ステータス表示

- 休みアイコンに同期状態を表示
  - 緑: KoT・Sheet 両方連携済み
  - 黄: 一部未連携（KoT or Sheet が失敗 or 未設定）
  - 赤: 両方未連携
- 未連携の場合、クリックで再同期

#### 4-3. 有休申請モーダルに KoT 連携チェックボックス

- Slack と同様に「King of Time にも登録する」チェックボックスを追加
- KoT 社員番号未設定の場合はチェックボックスを無効化し、設定を促すリンク表示

---

## ユーザーマッピング

Kobana（Supabase）と King of Time の紐付け:

| Kobana | King of Time |
|---|---|
| `profiles.id` (UUID) | `kot_employee_key` (社員番号 or 従業員キー) |

- 初回は各ユーザーがマイページで手動設定
- 将来的には `/employees` API で一括マッチングも可能

---

## セキュリティ考慮事項

- KoT API トークンはサーバーサイド専用（`KOT_API_TOKEN`、`NEXT_PUBLIC_` なし）
- Server Action 内でのみ API を呼び出す
- 社員番号は profiles テーブルの RLS で保護（自分のレコードのみ更新可能）

---

## 実装優先度

| 優先度 | タスク | 依存 |
|---|---|---|
| P0 | KoT API トークン取得・動作確認 | 管理者協力 |
| P0 | Google サービスアカウント作成・Sheet 共有設定 | 管理者協力 |
| P1 | DB スキーマ拡張 | - |
| P1 | KoT API クライアント実装 | P0 |
| P1 | Spread Sheet API クライアント実装 | P0 |
| P2 | submitDayOffRequest 統合（KoT + Sheet） | P1 |
| P2 | マイページに社員番号設定 | P1 |
| P3 | カレンダー同期ステータス表示 | P2 |
| P3 | 再同期機能（KoT + Sheet） | P2 |
| P4 | removeDayOff 連携（KoT + Sheet） | P2 |

---

## 事前確認チェックリスト

- [ ] King of Time の契約プランで API 利用が可能か
- [ ] 管理者に API トークン発行を依頼
- [ ] API ドキュメントで有休登録の正確なエンドポイント・パラメータを確認
- [ ] テスト環境（サンドボックス）の有無を確認
- [ ] 承認フローの要否を決定（直接登録 vs 申請ベース）
- [ ] Google Cloud でサービスアカウントを作成
- [ ] 有休管理 Spread Sheet のIDを確認
- [ ] Spread Sheet をサービスアカウントに共有（編集権限）
- [ ] Spread Sheet のシート名・列構成を確認（名前、日付、種別、日数など）
