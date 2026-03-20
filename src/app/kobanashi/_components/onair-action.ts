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

export async function createAndStartOnAir(
  speaker: string,
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です" };
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // kobanashiを作成
  const { data: newItem, error: insertError } = await supabase
    .from("kobanashi")
    .insert({
      title: "フリートーク",
      speaker,
      status: "未対応",
      scheduled_date: today,
    })
    .select("id")
    .single();

  if (insertError || !newItem) {
    return { error: insertError?.message ?? "作成に失敗しました" };
  }

  // 既存のOnAirを削除
  await supabase.from("current_onair").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // OnAirを開始
  const { error } = await supabase.from("current_onair").insert({
    kobanashi_id: newItem.id,
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
