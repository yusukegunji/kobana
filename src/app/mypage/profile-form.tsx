"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "./actions";

export function ProfileForm({
  defaultName,
  email,
}: {
  defaultName: string;
  email: string;
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <div className="space-y-2">
        <Label>メールアドレス</Label>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="display_name">表示名 *</Label>
        <Input
          id="display_name"
          name="display_name"
          required
          defaultValue={defaultName}
          placeholder="例: 田中太郎"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "保存中..." : "保存"}
      </Button>
    </form>
  );
}
