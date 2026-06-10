"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import type { PollKind } from "@/lib/types";

interface CreatePollInput {
  question: string;
  kind: PollKind;
  options: { label: string; color: string }[];
  kobanashiId?: string | null;
}

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;

export async function createPoll(
  input: CreatePollInput,
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です" };
  }

  // バリデーション
  const question = input.question.trim();
  if (!question) {
    return { error: "質問を入力してください" };
  }
  if (input.kind !== "yesno" && input.kind !== "multi") {
    return { error: "回答形式が不正です" };
  }
  const options = input.options
    .map((o) => ({ label: o.label.trim(), color: o.color }))
    .filter((o) => o.label.length > 0);
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    return { error: "選択肢は2〜4つにしてください" };
  }

  // 既存の live 投票を締め切る（画面には最新の1件だけ表示するため）
  await supabase
    .from("polls")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("status", "live");

  // 投票を作成
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      question,
      kind: input.kind,
      status: "live",
      kobanashi_id: input.kobanashiId ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (pollError || !poll) {
    return { error: pollError?.message ?? "投票の作成に失敗しました" };
  }

  // 選択肢を作成
  const { error: optionsError } = await supabase.from("poll_options").insert(
    options.map((o, i) => ({
      poll_id: poll.id,
      label: o.label,
      color: o.color,
      position: i,
    })),
  );

  if (optionsError) {
    return { error: optionsError.message };
  }

  revalidatePath("/");
  return { error: null };
}

export async function castVote(
  pollId: string,
  optionId: string,
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です" };
  }

  // live な投票か確認（締め切り後の投票を防ぐ）
  const { data: poll } = await supabase
    .from("polls")
    .select("id, status")
    .eq("id", pollId)
    .maybeSingle();
  if (!poll || poll.status !== "live") {
    return { error: "この投票は受付を終了しました" };
  }

  // 選択肢が投票に属するか確認
  const { data: option } = await supabase
    .from("poll_options")
    .select("id")
    .eq("id", optionId)
    .eq("poll_id", pollId)
    .maybeSingle();
  if (!option) {
    return { error: "選択肢が不正です" };
  }

  // 1人1票（変更可）: (poll_id, user_id) で upsert
  const { error } = await supabase.from("poll_votes").upsert(
    {
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id,
    },
    { onConflict: "poll_id,user_id" },
  );

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function endPoll(
  pollId: string,
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です" };
  }

  const { error } = await supabase
    .from("polls")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", pollId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { error: null };
}
