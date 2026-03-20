"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "./logout-action";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => logout())}
    >
      {isPending ? "ログアウト中..." : "ログアウト"}
    </Button>
  );
}
