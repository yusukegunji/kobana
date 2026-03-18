"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function createQuickKobanashi(speaker: string): Promise<{
  id: string | null;
  error: string | null;
}> {
  const supabase = await createServerClient();

  const today = new Date().toISOString().split("T")[0];

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
