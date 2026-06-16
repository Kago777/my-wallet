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

export async function createReceiptTransactions(formData: FormData) {
  const user = await requireAuth();

  const walletId      = requireString(formData, "walletId");
  const mainCategoryId = requireString(formData, "mainCategoryId");
  const date          = requireString(formData, "date");
  const store         = formData.get("store") as string | null;
  const mainItemsJson = requireString(formData, "mainItems");
  const splitItemsJson = requireString(formData, "splitItems");

  await assertWalletOwnership(walletId, user.id);

  const mainItems = JSON.parse(mainItemsJson) as { name: string; amount: number }[];
  const splitItems = JSON.parse(splitItemsJson) as { name: string; amount: number; categoryId: string }[];

  const mainTotal = mainItems.reduce((sum, item) => sum + item.amount, 0);

  await prisma.$transaction([
    // メインのTransaction（チェックなし項目の合計）
    ...(mainItems.length > 0 ? [
      prisma.transaction.create({
        data: {
          amount: mainTotal,
          type: "expense",
          categoryId: mainCategoryId,
          walletId,
          date: new Date(date),
          description: store ?? null,
          receiptItems: {
            create: mainItems.map((item) => ({
              name: item.name,
              amount: item.amount,
            })),
          },
        },
      }),
    ] : []),
    // 除外項目（チェックあり）ごとにTransaction作成
    ...splitItems.map((item) =>
      prisma.transaction.create({
        data: {
          amount: item.amount,
          type: "expense",
          categoryId: item.categoryId,
          walletId,
          date: new Date(date),
          description: item.name,
          receiptItems: {
            create: [{ name: item.name, amount: item.amount }],
          },
        },
      })
    ),
  ]);

  redirect("/transactions");
}

export async function updateReceiptItems(formData: FormData) {
  const user = await requireAuth();

  const transactionId  = requireString(formData, "transactionId");
  const mainItemsJson  = requireString(formData, "mainItems");
  const splitItemsJson = requireString(formData, "splitItems");
  const mainCategoryId = requireString(formData, "mainCategoryId");
  const walletId       = requireString(formData, "walletId");
  const date           = requireString(formData, "date");
  const store          = formData.get("store") as string | null;

  await assertTransactionOwnership(transactionId, user.id);

  const mainItems  = JSON.parse(mainItemsJson)  as { name: string; amount: number }[];
  const splitItems = JSON.parse(splitItemsJson) as { name: string; amount: number; categoryId: string }[];
  const mainTotal  = mainItems.reduce((sum, item) => sum + item.amount, 0);

  await prisma.$transaction([
    // 既存のReceiptItemを全削除して再作成
    prisma.receiptItem.deleteMany({ where: { transactionId } }),
    // メインTransactionを更新
    prisma.transaction.update({
      where: { id: transactionId },
      data: {
        amount: mainTotal,
        categoryId: mainCategoryId,
        walletId,
        date: new Date(date),
        description: store || null,
        receiptItems: {
          create: mainItems.map((item) => ({
            name: item.name,
            amount: item.amount,
          })),
        },
      },
    }),
    // 分割項目を新規Transaction作成
    ...splitItems.map((item) =>
      prisma.transaction.create({
        data: {
          amount: item.amount,
          type: "expense",
          categoryId: item.categoryId,
          walletId,
          date: new Date(date),
          description: item.name,
          receiptItems: {
            create: [{ name: item.name, amount: item.amount }],
          },
        },
      })
    ),
  ]);

  redirect("/transactions");
}