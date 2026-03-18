"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function createKobanashi(
  _state: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です" };
  }

  const title = formData.get("title") as string;
  const speaker = (user.user_metadata?.display_name as string) || user.email || "不明";
  const status = formData.get("status") as string;
  const scheduled_date = (formData.get("scheduled_date") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  const { error } = await supabase.from("kobanashi").insert({
    title,
    speaker,
    status,
    scheduled_date,
    notes,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/kobanashi");
  redirect("/kobanashi");
}
