"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function upsertFacilitator(date: string, userId: string) {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("facilitator_schedule")
    .upsert(
      { scheduled_date: date, user_id: userId },
      { onConflict: "scheduled_date" },
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  return { error: null };
}

export async function removeFacilitator(date: string) {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("facilitator_schedule")
    .delete()
    .eq("scheduled_date", date);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  return { error: null };
}
