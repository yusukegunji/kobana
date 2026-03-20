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

export async function removeDayOff(date: string) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const { error } = await supabase
    .from("user_days_off")
    .delete()
    .eq("user_id", user.id)
    .eq("off_date", date);

  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return { error: null };
}

export async function submitDayOffRequest(formData: FormData) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  const offDate = formData.get("off_date") as string;
  const offType = formData.get("off_type") as string;
  const offDays = formData.get("off_days") as string;
  const approval = formData.get("approval") as string;

  if (!offDate || !/^\d{4}-\d{2}-\d{2}$/.test(offDate)) {
    return { error: "有休/取得日を入力してください（例: 2026-03-20）" };
  }
  if (!offType) {
    return { error: "全日or半日を選択してください" };
  }
  if (!offDays) {
    return { error: "取得日数を選択してください" };
  }
  if (!approval) {
    return { error: "上長承認を選択してください" };
  }

  // DB に保存
  const { error: dbError } = await supabase
    .from("user_days_off")
    .upsert(
      { user_id: user.id, off_date: offDate },
      { onConflict: "user_id,off_date" },
    );

  if (dbError) {
    return { error: `DB保存エラー: ${dbError.message}` };
  }

  // Slack に投稿（チェックボックスが ON の場合のみ）
  const postToSlack = formData.get("post_to_slack") === "1";
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (postToSlack && webhookUrl) {
    // Slack メンション用に slack_user_id を取得
    const { data: profile } = await supabase
      .from("profiles")
      .select("slack_user_id")
      .eq("id", user.id)
      .maybeSingle();

    const displayName =
      (user.user_metadata?.display_name as string) ?? "不明なユーザー";
    const applicant = profile?.slack_user_id
      ? `<@${profile.slack_user_id}>`
      : displayName;

    try {
      const slackMessage = {
        text: `有休申請書`,
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "有休申請書", emoji: true },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*申請者:*\n${applicant}` },
              { type: "mrkdwn", text: `*有休/取得日:*\n${offDate}` },
              { type: "mrkdwn", text: `*有休/全日or半日:*\n${offType}` },
              { type: "mrkdwn", text: `*有休/取得日数:*\n${offDays}` },
              { type: "mrkdwn", text: `*上長承認/未・済:*\n${approval}` },
            ],
          },
        ],
      };

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackMessage),
      });

      if (!res.ok) {
        console.error("Slack投稿エラー:", res.status, await res.text());
      }
    } catch (e) {
      console.error("Slack投稿エラー:", e);
    }
  }

  revalidatePath("/calendar");
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
