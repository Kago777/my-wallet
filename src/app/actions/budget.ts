"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/auth.server";
import {
  assertBudgetOwnership,
  assertWalletOwnership,
} from "@/lib/authorization";
import { requireInt, requireString } from "@/lib/form";

export async function createBudget(formData: FormData) {
  const user = await requireAuth();

  const amount = requireInt(formData, "amount");
  const month = requireString(formData, "month");
  const categoryId = requireString(formData, "categoryId");
  const walletId = requireString(formData, "walletId");

  await assertWalletOwnership(walletId, user.id);

  await prisma.budget.create({
    data: {
      amount,
      month,
      categoryId,
      walletId,
    },
  });

  revalidatePath("/budgets");
}

export async function deleteBudget(formData: FormData) {
  const user = await requireAuth();
  const id = requireString(formData, "id");

  await assertBudgetOwnership(id, user.id);
  await prisma.budget.delete({ where: { id } });

  revalidatePath("/budgets");
}
