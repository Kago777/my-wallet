"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/auth.server";
import { assertWalletOwnership } from "@/lib/authorization";
import { requireInt, requireString } from "@/lib/form";
import { WalletType } from "@/generated/prisma/client";

function parseWalletType(value: string): WalletType {
  if (value === "cash" || value === "bank" || value === "credit" || value === "investment") return value;
  throw new Error("Invalid wallet type");
}

type CreditCardSettingInput = {
  billingDay: number;
  closingDay: number | null;
  settlementWalletId: string;
  billingMonthOffset: number;
};

function parseCreditCardSetting(formData: FormData): CreditCardSettingInput {
  const billingDay = requireInt(formData, "billingDay");
  const closingDayRaw = formData.get("closingDay");
  const closingDay =
    typeof closingDayRaw !== "string" || closingDayRaw.trim() === ""
      ? null
      : parseInt(closingDayRaw, 10);
  const settlementWalletId = requireString(formData, "settlementWalletId");
  const billingMonthOffset = requireInt(formData, "billingMonthOffset");

  if (billingDay < 1 || billingDay > 31) {
    throw new Error("引き落とし日は1〜31で入力してください");
  }
  if (closingDay !== null && (Number.isNaN(closingDay) || closingDay < 1 || closingDay > 31)) {
    throw new Error("締め日は1〜31で入力してください");
  }
  if (billingMonthOffset !== 1 && billingMonthOffset !== 2) {
    throw new Error("引き落とし月は翌月または翌々月を選択してください");
  }

  return { billingDay, closingDay, settlementWalletId, billingMonthOffset };
}

async function assertSettlementWallet(settlementWalletId: string, userId: string) {
  const wallet = await assertWalletOwnership(settlementWalletId, userId);
  if (wallet.type !== "bank") {
    throw new Error("引き落とし口座は銀行口座を選択してください");
  }
  return wallet;
}

export async function createWallet(formData: FormData) {
  const user = await requireAuth();

  const name = requireString(formData, "name");
  const type = parseWalletType(requireString(formData, "type"));

  const maxSortOrder = await prisma.wallet.aggregate({
    where: { userId: user.id },
    _max: { sortOrder: true },
  });

  const creditSetting = type === "credit" ? parseCreditCardSetting(formData) : null;
  if (creditSetting) {
    await assertSettlementWallet(creditSetting.settlementWalletId, user.id);
  }

  await prisma.wallet.create({
    data: {
      name,
      type,
      userId: user.id,
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
      ...(creditSetting && {
        creditCardSetting: {
          create: creditSetting,
        },
      }),
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

  const creditSetting = type === "credit" ? parseCreditCardSetting(formData) : null;
  if (creditSetting) {
    await assertSettlementWallet(creditSetting.settlementWalletId, user.id);
  }

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id },
      data: { name, type },
    });

    if (type === "credit" && creditSetting) {
      await tx.creditCardSetting.upsert({
        where: { walletId: id },
        create: { walletId: id, ...creditSetting },
        update: creditSetting,
      });
    } else {
      await tx.creditCardSetting.deleteMany({ where: { walletId: id } });
    }
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
