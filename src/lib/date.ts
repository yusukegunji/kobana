// 日付ユーティリティ
//
// サーバー（Cloudflare Workers）のランタイムTZは UTC のため、`new Date().getDate()`
// 等で「今日」を算出すると JST とずれる（UTC 0時 = JST 9時で日付が変わる）。
// 朝会の時間帯（JST 9時前後）に前日扱いになるのを防ぐため、ここでは常に
// Asia/Tokyo を基準に YYYY-MM-DD を算出する。

const JST_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// JST の「今日」を YYYY-MM-DD 形式で返す（en-CA ロケールは ISO 同形式）
export function todayInJST(now: Date = new Date()): string {
  return JST_DATE_FORMAT.format(now);
}
