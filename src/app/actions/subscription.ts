"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/auth.server";
import {
  assertSubscriptionOwnership,
  assertWalletOwnership,
} from "@/lib/authorization";
import { requireInt, requireString } from "@/lib/form";

export async function createSubscription(formData: FormData) {
  const user = await requireAuth();

  const name = requireString(formData, "name");
  const amount = requireInt(formData, "amount");
  const billingDate = requireInt(formData, "billingDate");
  const categoryId = requireString(formData, "categoryId");
  const walletId = requireString(formData, "walletId");

  await assertWalletOwnership(walletId, user.id);

  await prisma.subscription.create({
    data: {
      name,
      amount,
      billingDate,
      categoryId,
      walletId,
    },
  });

  revalidatePath("/subscriptions");
}

export async function deleteSubscription(formData: FormData) {
  const user = await requireAuth();
  const id = requireString(formData, "id");

  await assertSubscriptionOwnership(id, user.id);
  await prisma.subscription.delete({ where: { id } });

  revalidatePath("/subscriptions");
}
