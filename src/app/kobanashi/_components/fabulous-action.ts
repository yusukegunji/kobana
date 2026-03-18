"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function toggleFabulous(
  kobanashiId: string,
): Promise<{ error: string | null; fabuloused: boolean }> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です", fabuloused: false };
  }

  // 既にファビュラス済みかチェック
  const { data: existing } = await supabase
    .from("kobanashi_fabulous")
    .select("id")
    .eq("kobanashi_id", kobanashiId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // 取り消し
    const { error } = await supabase
      .from("kobanashi_fabulous")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message, fabuloused: true };
    revalidatePath("/");
    revalidatePath("/kobanashi");
    return { error: null, fabuloused: false };
  } else {
    // 追加
    const { error } = await supabase
      .from("kobanashi_fabulous")
      .insert({ kobanashi_id: kobanashiId, user_id: user.id });
    if (error) return { error: error.message, fabuloused: false };
    revalidatePath("/");
    revalidatePath("/kobanashi");
    return { error: null, fabuloused: true };
  }
}
