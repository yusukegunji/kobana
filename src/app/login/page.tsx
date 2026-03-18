"use client";

import { useState, useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticate } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(authenticate, {
    error: null,
  });

  const isLogin = mode === "login";

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Kobana</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin
              ? "小噺管理サイトにログイン"
              : "新規アカウントを作成"}
          </p>
        </div>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="mode" value={mode} />
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={isLogin ? undefined : 6}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? isLogin
                ? "ログイン中..."
                : "登録中..."
              : isLogin
                ? "ログイン"
                : "新規登録"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? (
            <>
              アカウントをお持ちでない方は{" "}
              <button
                type="button"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
                onClick={() => setMode("signup")}
              >
                新規登録
              </button>
            </>
          ) : (
            <>
              既にアカウントをお持ちの方は{" "}
              <button
                type="button"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
                onClick={() => setMode("login")}
              >
                ログイン
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
