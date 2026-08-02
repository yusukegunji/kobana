"use server";

import { createServerClient } from "@/lib/supabase/server";
import { todayInJST } from "@/lib/date";

const MAX_THEME_LENGTH = 120;
const MAX_ANSWER_LENGTH = 60;

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

// 司会（本日のファシリテーター）かどうかを検証する。
// 担当が未設定の日は誰も司会できなくなってしまうため、その場合は全員に許可する。
// 問題なければ null、そうでなければユーザー向けのエラーメッセージを返す。
async function verifyHost(
  supabase: ServerClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("facilitator_schedule")
    .select("user_id")
    .eq("scheduled_date", todayInJST())
    .maybeSingle();

  if (error) {
    return "ファシリテーターの確認に失敗しました";
  }
  if (!data) {
    return null;
  }
  return data.user_id === userId
    ? null
    : "司会の操作は本日のファシリテーターのみ可能です";
}

// お題を出して新しいゲームを開始する（画面には常に最新の1件が表示される）
export async function startGame(
  theme: string,
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です" };
  }

  const hostError = await verifyHost(supabase, user.id);
  if (hostError) {
    return { error: hostError };
  }

  const trimmed = theme.trim();
  if (!trimmed) {
    return { error: "お題を入力してください" };
  }
  if (trimmed.length > MAX_THEME_LENGTH) {
    return { error: `お題は${MAX_THEME_LENGTH}文字以内にしてください` };
  }

  const { error } = await supabase
    .from("seikai_games")
    .insert({ theme: trimmed, host_id: user.id });

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

// 回答を送信する（締切前なら何度でも書き直せる）
export async function submitAnswer(
  gameId: string,
  body: string,
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です" };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { error: "回答を入力してください" };
  }
  if (trimmed.length > MAX_ANSWER_LENGTH) {
    return { error: `回答は${MAX_ANSWER_LENGTH}文字以内にしてください` };
  }

  // 締切後の回答・書き換えを防ぐ
  const { data: game } = await supabase
    .from("seikai_games")
    .select("id, status")
    .eq("id", gameId)
    .maybeSingle();
  if (!game) {
    return { error: "お題が見つかりません" };
  }
  if (game.status !== "answering") {
    return { error: "このお題は締め切られました" };
  }

  const { error } = await supabase.from("seikai_answers").upsert(
    { game_id: gameId, user_id: user.id, body: trimmed },
    { onConflict: "game_id,user_id" },
  );

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

// 締め切って回答を一斉公開する
export async function revealAnswers(
  gameId: string,
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です" };
  }

  const hostError = await verifyHost(supabase, user.id);
  if (hostError) {
    return { error: hostError };
  }

  // status 条件を付けて二重公開を防ぐ
  const { data, error } = await supabase
    .from("seikai_games")
    .update({ status: "revealed", revealed_at: new Date().toISOString() })
    .eq("id", gameId)
    .eq("status", "answering")
    .select("id");

  if (error) {
    return { error: error.message };
  }
  if (!data || data.length === 0) {
    return { error: "すでに公開済みです" };
  }
  return { error: null };
}

// 司会が回答に正解マークを付け外しする
export async function setAnswerCorrect(
  gameId: string,
  answerId: string,
  isCorrect: boolean,
): Promise<{ error: string | null }> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です" };
  }

  const hostError = await verifyHost(supabase, user.id);
  if (hostError) {
    return { error: hostError };
  }

  // 公開前は他人の回答を読めない（RLS）ため、ゲームの状態から先に判定する
  const { data: game } = await supabase
    .from("seikai_games")
    .select("id, status")
    .eq("id", gameId)
    .maybeSingle();
  if (!game) {
    return { error: "お題が見つかりません" };
  }
  if (game.status !== "revealed") {
    return { error: "公開後に正解を決めてください" };
  }

  const { error } = await supabase
    .from("seikai_answers")
    .update({ is_correct: isCorrect })
    .eq("id", answerId)
    .eq("game_id", gameId);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}
