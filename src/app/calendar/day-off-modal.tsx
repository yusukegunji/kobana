"use client";

import { useActionState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitDayOffRequest } from "./actions";

interface DayOffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  onSuccess: () => void;
}

export function DayOffModal({
  open,
  onOpenChange,
  date,
  onSuccess,
}: DayOffModalProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string | null }, formData: FormData) => {
      const result = await submitDayOffRequest(formData);
      if (!result.error) {
        onSuccess();
        onOpenChange(false);
      }
      return result;
    },
    { error: null },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-stone-900 text-stone-100 ring-stone-700">
        <DialogHeader>
          <DialogTitle className="text-stone-100">有休申請書</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="off_date" value={date} />

          <div className="space-y-1.5">
            <Label htmlFor="off_date_display" className="text-stone-300">
              有休/取得日
            </Label>
            <Input
              id="off_date_display"
              value={date}
              readOnly
              className="border-stone-700 bg-stone-800 text-stone-200"
            />
            <p className="text-xs text-stone-500">有休/取得日。</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="off_type" className="text-stone-300">
              有休/全日or半日
            </Label>
            <select
              id="off_type"
              name="off_type"
              required
              defaultValue=""
              className="h-8 w-full rounded-lg border border-stone-700 bg-stone-800 px-2.5 text-sm text-stone-200 outline-none focus:border-stone-500"
            >
              <option value="" disabled>
                オプションを選択する
              </option>
              <option value="全日">全日</option>
              <option value="半日">半日</option>
            </select>
            <p className="text-xs text-stone-500">有休/全日or半日。</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="off_days" className="text-stone-300">
              有休/取得日数
            </Label>
            <select
              id="off_days"
              name="off_days"
              required
              defaultValue=""
              className="h-8 w-full rounded-lg border border-stone-700 bg-stone-800 px-2.5 text-sm text-stone-200 outline-none focus:border-stone-500"
            >
              <option value="" disabled>
                オプションを選択する
              </option>
              <option value="0.5">0.5</option>
              <option value="1">1</option>
              <option value="1.5">1.5</option>
              <option value="2">2</option>
              <option value="2.5">2.5</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <p className="text-xs text-stone-500">有休/取得日数。</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="approval" className="text-stone-300">
              上長承認/未・済
            </Label>
            <select
              id="approval"
              name="approval"
              required
              defaultValue=""
              className="h-8 w-full rounded-lg border border-stone-700 bg-stone-800 px-2.5 text-sm text-stone-200 outline-none focus:border-stone-500"
            >
              <option value="" disabled>
                オプションを選択する
              </option>
              <option value="未">未</option>
              <option value="済">済</option>
            </select>
            <p className="text-xs text-stone-500">上長承認/未・済。</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="post_to_slack"
              value="1"
              defaultChecked
              className="h-4 w-4 rounded border-stone-600 bg-stone-800 accent-teal-500"
            />
            <span className="text-sm text-stone-300">Slack にも投稿する</span>
          </label>

          {state.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <DialogFooter className="border-stone-800 bg-stone-900/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-stone-700 bg-transparent text-stone-300 hover:bg-stone-800"
            >
              閉じる
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-teal-600 text-white hover:bg-teal-500"
            >
              {isPending ? "送信中..." : "送信する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
