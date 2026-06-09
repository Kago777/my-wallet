import "server-only";

import { prisma } from "@/lib/db";

export function getCategoriesForUser(userId: string) {
  return prisma.category.findMany({
    where: { OR: [{ isDefault: true }, { userId }] },
    orderBy: { name: "asc" },
  });
}

export function getWalletsForUser(userId: string) {
  return prisma.wallet.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}
