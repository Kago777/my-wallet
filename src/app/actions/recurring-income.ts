"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/auth.server";
import {
  assertRecurringIncomeOwnership,
  assertWalletOwnership,
} from "@/lib/authorization";
import { optionalString, requireInt, requireString } from "@/lib/form";
import { CycleType } from "@/generated/prisma/client";

function parseCycleType(value: string): CycleType {
  if (value === "monthly" || value === "weekly" || value === "yearly") return value;
  throw new Error("Invalid cycle type");
}

export async function createRecurringIncome(formData: FormData) {
  const user = await requireAuth();

  const name = requireString(formData, "name");
  const amount = requireInt(formData, "amount");
  const cycleType = parseCycleType(requireString(formData, "cycleType"));
  const cycleDay = requireInt(formData, "cycleDay");
  const startDate = requireString(formData, "startDate");
  const endDate = optionalString(formData, "endDate");
  const categoryId = requireString(formData, "categoryId");
  const walletId = requireString(formData, "walletId");

  await assertWalletOwnership(walletId, user.id);

  await prisma.recurringIncome.create({
    data: {
      name,
      amount,
      cycleType,
      cycleDay,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      categoryId,
      walletId,
    },
  });

  revalidatePath("/recurring-incomes");
}

export async function deleteRecurringIncome(formData: FormData) {
  const user = await requireAuth();
  const id = requireString(formData, "id");

  await assertRecurringIncomeOwnership(id, user.id);
  await prisma.recurringIncome.delete({ where: { id } });

  revalidatePath("/recurring-incomes");
}
