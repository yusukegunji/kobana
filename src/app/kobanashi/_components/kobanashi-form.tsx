"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_OPTIONS } from "@/lib/constants";
import type { Kobanashi } from "@/lib/types";

type FormAction = (
  state: { error: string | null },
  formData: FormData
) => Promise<{ error: string | null }>;

export function KobanashiForm({
  action,
  defaultValues,
}: {
  action: FormAction;
  defaultValues?: Partial<Kobanashi>;
}) {
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-6">
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">タイトル *</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">ステータス</Label>
        <Select
          name="status"
          defaultValue={defaultValues?.status ?? "未対応"}
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduled_date">予定日</Label>
        <Input
          id="scheduled_date"
          name="scheduled_date"
          type="date"
          defaultValue={defaultValues?.scheduled_date ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">備考 (参照リンク等)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="参考URLや関連資料のリンクなど"
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
}
