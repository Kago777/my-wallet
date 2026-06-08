"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTransaction(formData: FormData) {
  const amount = parseInt(formData.get("amount") as string);
  const type = formData.get("type") as string;
  const categoryId = formData.get("categoryId") as string;
  const description = formData.get("description") as string;
  const walletId = formData.get("walletId") as string;
  const date = formData.get("date") as string;

  await prisma.transaction.create({
    data: {
      amount,
      type,
      categoryId,
      description,
      walletId,
      date: new Date(date),
    },
  });

  redirect("/transactions");
}

export async function updateTransaction(formData: FormData) {
  const id = formData.get("id") as string;
  const amount = parseInt(formData.get("amount") as string);
  const type = formData.get("type") as string;
  const categoryId = formData.get("categoryId") as string;
  const description = formData.get("description") as string;
  const walletId = formData.get("walletId") as string;
  const date = formData.get("date") as string;

  await prisma.transaction.update({
    where: { id },
    data: {
      amount,
      type,
      categoryId,
      description,
      walletId,
      date: new Date(date),
    },
  });

  redirect("/transactions");
}

export async function deleteTransaction(formData: FormData) {
  const id = formData.get("id") as string;

  await prisma.transaction.delete({ where: { id } });

  revalidatePath("/transactions");
}