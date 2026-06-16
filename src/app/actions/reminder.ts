"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/auth.server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 既読にする
export async function markReminderAsRead(id: string) {
  const user = await requireAuth();
  await prisma.reminder.update({
    where: { id, userId: user.id },
    data: { isRead: true },
  });
  revalidatePath("/");
}

// 削除する
export async function deleteReminder(id: string) {
  const user = await requireAuth();
  await prisma.reminder.delete({
    where: { id, userId: user.id },
  });
  revalidatePath("/");
}

// 全部既読にする
export async function markAllRemindersAsRead() {
  const user = await requireAuth();
  await prisma.reminder.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/");
}

// 変動費のリマインダーから取引を作成する
export async function createTransactionFromReminder(
  reminderId: string,
  formData: FormData
) {
  const user = await requireAuth();
  const amount = parseInt(formData.get("amount") as string);

  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId, userId: user.id },
    include: { recurringBill: true },
  });

  if (!reminder?.recurringBill) throw new Error("Not found");

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  // 今月すでに記録済みか確認
  const existing = await prisma.transaction.findFirst({
    where: {
      recurringBillId: reminder.recurringBill.id,
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  if (existing) {
    // 既存のTransactionの編集ページにリダイレクト
    redirect(`/transactions/${existing.id}/edit`);
  }

  await prisma.transaction.create({
    data: {
      amount,
      type: "expense",
      description: reminder.title,
      date: today,
      walletId: reminder.recurringBill.walletId,
      categoryId: reminder.recurringBill.categoryId,
      recurringBillId: reminder.recurringBill.id,
    },
  });

  await prisma.reminder.update({
    where: { id: reminderId },
    data: { isRead: true },
  });

  revalidatePath("/");
}