"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function updateKobanashi(
  _state: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const status = formData.get("status") as string;
  const scheduled_date = (formData.get("scheduled_date") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  const { error } = await supabase
    .from("kobanashi")
    .update({
      title,
      status,
      scheduled_date,
      notes,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/kobanashi");
  redirect("/kobanashi");
}

export async function deleteKobanashi(id: string): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const { error } = await supabase.from("kobanashi").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/kobanashi");
  redirect("/kobanashi");
}
