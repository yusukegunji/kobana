import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getUser() は毎リクエスト Auth API へ往復するため、JWT をローカル検証する
  // getClaims() を使う（期限切れならセッション更新が走り Cookie も更新される）
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims ?? null;

  const pathname = request.nextUrl.pathname;

  // API ルートは認証スキップ（独自の認証を行う）
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  // 未認証 → ログインページへ
  if (
    !claims &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 認証済みだが display_name 未設定 → マイページへ
  if (
    claims &&
    !claims.user_metadata?.display_name &&
    !pathname.startsWith("/mypage") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/mypage";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
