#!/usr/bin/env bash
# 初期表示の遅延を切り分けるための計測スクリプト。原因が特定できたら削除する。
#
#   ./scripts/measure.sh          # 1回だけ計測（朝イチの1発目に使う）
#   ./scripts/measure.sh 10       # 10回繰り返して分布を見る（同時アクセスの再現に近い）
#
# 見方:
#   Worker  … Cloudflare だけの時間（未ログインなので Supabase は経由しない）
#   静的    … Worker を通らない素のネットワーク往復（比較の基準）
#   DB      … Supabase が応答するまでの時間。100ms 前後 = 正常 / 1秒超 = 起きかけ /
#             10秒超・失敗 = 一時停止から復帰中の可能性

set -u

BASE="${KOBANA_URL:-https://kobana.gunji-yusuke-873.workers.dev}"
COUNT="${1:-1}"

printf '対象: %s\n\n' "$BASE"
printf '%-4s  %-10s  %-10s  %-10s\n' "#" "静的" "Worker" "DB(Supabase)"
printf -- '--------------------------------------------------\n'

for i in $(seq 1 "$COUNT"); do
  static=$(curl -s -o /dev/null -w '%{time_starttransfer}' "$BASE/favicon.ico")
  worker=$(curl -s -o /dev/null -w '%{time_starttransfer}' "$BASE/")
  health=$(curl -s --max-time 60 "$BASE/api/health")
  db=$(printf '%s' "$health" | sed -n 's/.*"dbMs":\([0-9]*\).*/\1/p')
  [ -z "$db" ] && db="失敗"

  printf '%-4s  %-10s  %-10s  %-10s\n' \
    "$i" "$(printf '%.0fms' "$(echo "$static * 1000" | bc -l)")" \
    "$(printf '%.0fms' "$(echo "$worker * 1000" | bc -l)")" \
    "${db}ms"
done
