"use server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/auth.server";
import { redirect } from "next/navigation";

export async function createTransfer(formData: FormData) {
  const user = await requireAuth();

  const fromWalletId = formData.get("fromWalletId") as string;
  const toWalletId   = formData.get("toWalletId")   as string;
  const amount       = Number(formData.get("amount"));
  const date         = new Date(formData.get("date") as string);
  const description  = formData.get("description")  as string | null;

  // バリデーション
  if (fromWalletId === toWalletId) throw new Error("送金元と送金先が同じです");
  if (amount <= 0)                 throw new Error("金額は1以上を入力してください");

  await prisma.transfer.create({
    data: { fromWalletId, toWalletId, amount, date, description, userId: user.id },
  });

  redirect("/");
}

export async function updateTransfer(formData: FormData) {
  const user = await requireAuth();

  const id          = formData.get("id")          as string;
  const fromWalletId = formData.get("fromWalletId") as string;
  const toWalletId   = formData.get("toWalletId")   as string;
  const amount       = Number(formData.get("amount"));
  const date         = new Date(formData.get("date") as string);
  const description  = formData.get("description")  as string | null;

  if (fromWalletId === toWalletId) throw new Error("送金元と送金先が同じです");
  if (amount <= 0)                 throw new Error("金額は1以上を入力してください");

  const transfer = await prisma.transfer.findUnique({ where: { id } });
  if (!transfer || transfer.userId !== user.id) throw new Error("Not found");

  await prisma.transfer.update({
    where: { id },
    data: { fromWalletId, toWalletId, amount, date, description },
  });

  redirect("/transactions?type=transfer");
}

export async function deleteTransfer(formData: FormData) {
  const user = await requireAuth();
  const id = formData.get("id") as string;

  const transfer = await prisma.transfer.findUnique({ where: { id } });
  if (!transfer || transfer.userId !== user.id) throw new Error("Not found");

  await prisma.transfer.delete({ where: { id } });
  redirect("/transactions?type=transfer");
}