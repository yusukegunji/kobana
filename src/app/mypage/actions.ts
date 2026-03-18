"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function updateProfile(
  _state: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const displayName = (formData.get("display_name") as string).trim();
  if (!displayName) {
    return { error: "名前を入力してください" };
  }

  const { error } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });

  if (error) {
    return { error: error.message };
  }

  // profiles テーブルにも upsert
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: displayName }, { onConflict: "id" });
  }

  redirect("/kobanashi");
}
