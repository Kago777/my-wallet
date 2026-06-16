"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/auth.server";
import { assertWalletOwnership } from "@/lib/authorization";
import { requireString } from "@/lib/form";
import { WalletType } from "@/generated/prisma/client";

function parseWalletType(value: string): WalletType {
  if (value === "cash" || value === "bank" || value === "credit" || value === "investment") return value;
  throw new Error("Invalid wallet type");
}

export async function createWallet(formData: FormData) {
  const user = await requireAuth();

  const name = requireString(formData, "name");
  const type = parseWalletType(requireString(formData, "type"));

  const maxSortOrder = await prisma.wallet.aggregate({
    where: { userId: user.id },
    _max: { sortOrder: true },
  });

  await prisma.wallet.create({
    data: {
      name,
      type,
      userId: user.id,
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/wallets");
}

export async function updateWallet(formData: FormData) {
  const user = await requireAuth();
  const id = requireString(formData, "id");
  const name = requireString(formData, "name");
  const type = parseWalletType(requireString(formData, "type"));

  await assertWalletOwnership(id, user.id);

  await prisma.wallet.update({
    where: { id },
    data: { name, type },
  });

  revalidatePath("/");
  revalidatePath("/wallets");
  revalidatePath(`/wallets/${id}/edit`);

  redirect("/wallets");
}

export async function deleteWallet(formData: FormData) {
  const user = await requireAuth();
  const id = requireString(formData, "id");

  const wallet = await assertWalletOwnership(id, user.id);

  const transactionCount = await prisma.transaction.count({
    where: { walletId: wallet.id },
  });
  if (transactionCount > 0) {
    throw new Error("Cannot delete wallet with existing transactions");
  }

  await prisma.wallet.delete({ where: { id } });

  revalidatePath("/wallets");
}

