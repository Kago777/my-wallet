"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/auth.server";
import {
  assertTransactionOwnership,
  assertWalletOwnership,
} from "@/lib/authorization";
import { requireInt, requireString } from "@/lib/form";
import { TransactionType } from "@/generated/prisma/client";

function parseTransactionType(value: string): TransactionType {
  if (value === "income" || value === "expense") return value;
  throw new Error("Invalid transaction type");
}

export async function createTransaction(formData: FormData) {
  const user = await requireAuth();

  const amount = requireInt(formData, "amount");
  const type = parseTransactionType(requireString(formData, "type"));
  const categoryId = requireString(formData, "categoryId");
  const description = optionalDescription(formData);
  const walletId = requireString(formData, "walletId");
  const date = requireString(formData, "date");

  await assertWalletOwnership(walletId, user.id);

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
  const user = await requireAuth();

  const id = requireString(formData, "id");
  const amount = requireInt(formData, "amount");
  const type = parseTransactionType(requireString(formData, "type"));
  const categoryId = requireString(formData, "categoryId");
  const description = optionalDescription(formData);
  const walletId = requireString(formData, "walletId");
  const date = requireString(formData, "date");

  await assertTransactionOwnership(id, user.id);
  await assertWalletOwnership(walletId, user.id);

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
  const user = await requireAuth();
  const id = requireString(formData, "id");

  await assertTransactionOwnership(id, user.id);
  await prisma.transaction.delete({ where: { id } });

  revalidatePath("/transactions");
}

function optionalDescription(formData: FormData): string | null {
  const value = formData.get("description");
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.trim();
}

export async function createTransactionWithItems(formData: FormData) {
  const user = await requireAuth();

  const amount      = Number(formData.get("amount"));
  const categoryId  = formData.get("categoryId") as string;
  const walletId    = formData.get("walletId")   as string;
  const date        = new Date(formData.get("date") as string);
  const description = formData.get("description") as string | null;
  const itemsJson   = formData.get("items")       as string;

  // ウォレットの所有者確認
  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet || wallet.userId !== user.id) throw new Error("Not found");

  const items = JSON.parse(itemsJson) as { name: string; amount: number }[];

  // TransactionとReceiptItemをアトミックに作成
  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        amount,
        type: "expense",
        categoryId,
        walletId,
        date,
        description,
        receiptItems: {
          create: items.map((item) => ({
            name: item.name,
            amount: item.amount,
          })),
        },
      },
    }),
  ]);

  redirect("/");
}