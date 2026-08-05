import { createServerClient } from "@/lib/supabase/server";

// Supabase が起きているか / 応答が何 ms かを、ログイン無しで測るための計測用エンドポイント。
// middleware は /api/ を素通しするので認証は不要。データは一切返さない。
// 原因が特定できたら削除する。
export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const supabase = await createServerClient();

  const { error } = await supabase.from("kobanashi").select("id").limit(1);
  const dbMs = Date.now() - start;

  console.log(`[timing] health.db ${dbMs}ms ok=${!error}`);

  return Response.json(
    { ok: !error, dbMs, error: error?.message ?? null },
    { headers: { "cache-control": "no-store" } },
  );
}
