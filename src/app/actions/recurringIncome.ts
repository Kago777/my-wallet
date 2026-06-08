"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/auth.server";
import { redirect } from "next/navigation";

export async function createRecurringIncome(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const amount = parseInt(formData.get("amount") as string);
  const cycleType = formData.get("cycleType") as string;
  const cycleDay = parseInt(formData.get("cycleDay") as string);
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const categoryId = formData.get("categoryId") as string;
  const walletId = formData.get("walletId") as string;

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
  const id = formData.get("id") as string;
  await prisma.recurringIncome.delete({ where: { id } });
  revalidatePath("/recurring-incomes");
}