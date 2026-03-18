"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function authenticate(
  _state: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const mode = formData.get("mode") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください" };
  }

  const supabase = await createServerClient();

  if (mode === "signup") {
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain !== "truss.co.jp" && domain !== "truss.company") {
      return { error: "登録ドメインは限られています" };
    }

    if (password.length < 6) {
      return { error: "パスワードは6文字以上で入力してください" };
    }

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message.includes("rate limit")) {
        return { error: "しばらく時間を置いてから再度お試しください" };
      }
      return {
        error: "登録に失敗しました。メールアドレスや入力内容をご確認ください",
      };
    }

    redirect("/mypage");
  }

  // login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません" };
  }

  if (!data.user.user_metadata?.display_name) {
    redirect("/mypage");
  }

  redirect("/kobanashi");
}
