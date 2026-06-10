"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { todayInJST } from "@/lib/date";

export async function createQuickKobanashi(speaker: string): Promise<{
  id: string | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const today = todayInJST();

  const { data, error } = await supabase
    .from("kobanashi")
    .insert({
      title: `${speaker}の小噺`,
      speaker,
      status: "未対応",
      scheduled_date: today,
    })
    .select("id")
    .single();

  if (error) {
    return { id: null, error: error.message };
  }

  revalidatePath("/");
  return { id: data.id, error: null };
}
