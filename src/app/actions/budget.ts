"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/auth.server";
import { redirect } from "next/navigation";

export async function createBudget(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const amount = parseInt(formData.get("amount") as string);
  const month = formData.get("month") as string;
  const categoryId = formData.get("categoryId") as string;
  const walletId = formData.get("walletId") as string;

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
  const id = formData.get("id") as string;
  await prisma.budget.delete({ where: { id } });
  revalidatePath("/budgets");
}