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

  const slackUserId = (formData.get("slack_user_id") as string | null)?.trim() || null;

  // Slack User ID の形式チェック（入力がある場合）
  if (slackUserId && !/^[UW][A-Z0-9]{6,}$/.test(slackUserId)) {
    return { error: "Slack User ID の形式が正しくありません（例: U0123456789）" };
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
      .upsert(
        { id: user.id, display_name: displayName, slack_user_id: slackUserId },
        { onConflict: "id" },
      );
  }

  redirect("/kobanashi");
}
