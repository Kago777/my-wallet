/**
 * [認証] サーバー専用認証ヘルパー - Node.js のみ
 *
 * 役割：セッション情報からDBのユーザー情報を取得する
 * 実行環境：Node.js のみ（server-only）
 * 重要：middleware.tsからは絶対にインポートしない
 *
 * 処理フロー：
 * 1. auth()でGoogleセッションを取得
 * 2. セッションのメールアドレスでDBを検索
 * 3. DBにユーザーが存在しない場合は新規作成
 * 4. DBのユーザー情報を返す
 *
 * 使用箇所：各ページ（page.tsx）でユーザーIDを取得するとき
 * 依存：src/auth.ts, src/lib/prisma.ts
 */
import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  let dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: session.user.email,
        name: session.user.name ?? "",
      },
    });
  }

  return dbUser;
}