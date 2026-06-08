"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/auth.server";
import { redirect } from "next/navigation";

export async function createSubscription(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const amount = parseInt(formData.get("amount") as string);
  const billingDate = parseInt(formData.get("billingDate") as string);
  const categoryId = formData.get("categoryId") as string;
  const walletId = formData.get("walletId") as string;

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
  const id = formData.get("id") as string;
  await prisma.subscription.delete({ where: { id } });
  revalidatePath("/subscriptions");
}