/**
 * [認証] NextAuth設定 - Edge Runtime 対応
 *
 * 役割：NextAuthの初期化・Googleプロバイダーの設定
 * 実行環境：Edge Runtime / Node.js 両対応
 * 重要：このファイルにはPrismaを含めない（Edge Runtimeで動かないため）
 *
 * エクスポート：
 * - handlers → /api/auth/[...nextauth]/route.ts で使用
 * - signIn   → ログインページで使用
 * - signOut  → Navbarで使用
 * - auth     → middleware.ts・各ページで使用
 *
 * 依存：next-auth, next-auth/providers/google
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
});