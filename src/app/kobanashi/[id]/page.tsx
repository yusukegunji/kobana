import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { Kobanashi } from "@/lib/types";
import { DeleteButton } from "../_components/delete-button";
import { KobanashiForm } from "../_components/kobanashi-form";
import { LinkButton } from "../_components/link-button";
import { updateKobanashi } from "./actions";

export default async function EditKobanashiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("kobanashi")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const kobanashi = data as Kobanashi;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">小噺を編集</h1>
        <div className="flex items-center gap-3">
          <DeleteButton id={kobanashi.id} />
          <LinkButton href="/kobanashi" variant="outline">
            一覧に戻る
          </LinkButton>
        </div>
      </div>
      <KobanashiForm action={updateKobanashi} defaultValues={kobanashi} />
    </div>
  );
}
