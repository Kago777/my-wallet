"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/auth.server";
import { revalidatePath } from "next/cache";

export async function createRecurringBill(formData: FormData) {
  const user = await requireAuth();

  const walletId = formData.get("walletId") as string;
  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, userId: user.id },
  });
  if (!wallet) throw new Error("Unauthorized");

  await prisma.recurringBill.create({
    data: {
      name: formData.get("name") as string,
      estimatedAmount: parseInt(formData.get("estimatedAmount") as string),
      billingDay: formData.get("billingDay") ? parseInt(formData.get("billingDay") as string) : null,
      cycleType: formData.get("cycleType") as "monthly" | "weekly" | "yearly",
      provider: formData.get("provider") as string || null,
      walletId,
      categoryId: formData.get("categoryId") as string,
    },
  });

  revalidatePath("/recurring-bills");
}

export async function deleteRecurringBill(formData: FormData) {
  const user = await requireAuth();
  const id = formData.get("id") as string;

  const bill = await prisma.recurringBill.findFirst({
    where: { id, wallet: { userId: user.id } },
  });
  if (!bill) throw new Error("Unauthorized");

  await prisma.recurringBill.delete({ where: { id } });

  revalidatePath("/recurring-bills");
}