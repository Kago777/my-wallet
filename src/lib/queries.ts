import "server-only";

import { prisma } from "@/lib/db";

export async function getCategoriesForUser(userId: string) {
  return prisma.category.findMany({
    where: {
      OR: [{ userId }, { isDefault: true }],
    },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });
}

export function getWalletsForUser(userId: string) {
  return prisma.wallet.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
