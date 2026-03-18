"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function startOnAir(
  kobanashiId: string,
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です" };
  }

  // 既存のOnAirを削除（同時に1つだけ）
  await supabase.from("current_onair").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // 新しいOnAirを挿入
  const { error } = await supabase.from("current_onair").insert({
    kobanashi_id: kobanashiId,
    started_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/kobanashi");
  return { error: null };
}

export async function finishOnAir(
  id: string,
  durationSeconds: number
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const durationMinutes = Math.round(durationSeconds / 60);

  const { error } = await supabase
    .from("kobanashi")
    .update({
      published_at: new Date().toISOString(),
      duration: durationMinutes > 0 ? durationMinutes : 1,
      status: "対応済",
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  // OnAir状態をクリア
  await supabase.from("current_onair").delete().eq("kobanashi_id", id);

  revalidatePath("/");
  revalidatePath("/kobanashi");
  return { error: null };
}
