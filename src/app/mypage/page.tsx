import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function MyPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = (user.user_metadata?.display_name as string) ?? "";

  // profiles テーブルから slack_user_id を取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("slack_user_id")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          ホームに戻る
        </Link>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">プロフィール設定</h1>
          <p className="text-sm text-muted-foreground">
            小噺の話し手として表示される名前を設定してください
          </p>
        </div>
        <ProfileForm
          defaultName={displayName}
          email={user.email ?? ""}
          defaultSlackUserId={profile?.slack_user_id ?? ""}
        />
      </div>
    </div>
  );
}
