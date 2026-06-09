"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/auth.server";
import { assertWalletOwnership } from "@/lib/authorization";
import { requireString } from "@/lib/form";
import { WalletType } from "@/generated/prisma/client";

function parseWalletType(value: string): WalletType {
  if (value === "cash" || value === "bank" || value === "credit") return value;
  throw new Error("Invalid wallet type");
}

export async function createWallet(formData: FormData) {
  const user = await requireAuth();

  const name = requireString(formData, "name");
  const type = parseWalletType(requireString(formData, "type"));

  await prisma.wallet.create({
    data: {
      name,
      type,
      userId: user.id,
    },
  });

  revalidatePath("/wallets");
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
