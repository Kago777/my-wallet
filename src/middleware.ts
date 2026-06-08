/**
 * [認証] ミドルウェア - Edge Runtime で動作
 *
 * 役割：全リクエストに対してログイン状態をチェックする門番
 * 実行環境：Edge Runtime（Node.js不可・Prisma使用不可）
 *
 * 処理フロー：
 * 1. リクエストが来る
 * 2. auth()でセッションを確認（Googleのセッション情報のみ・Prisma DB参照なし）
 * 3. 未ログイン → /login にリダイレクト
 * 4. ログイン済みで/loginにアクセス → / にリダイレクト
 * 5. それ以外 → そのまま通過
 *
 * 依存：src/auth.ts（Prismaなし・Edge対応）
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};