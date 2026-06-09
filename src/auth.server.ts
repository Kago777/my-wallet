/**
 * [認証] サーバー専用認証ヘルパー - Node.js のみ
 */
import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

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

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
