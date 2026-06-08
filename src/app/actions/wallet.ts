"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/auth.server";
import { redirect } from "next/navigation";

export async function createWallet(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;

  await prisma.wallet.create({
    data: {
      name,
      type,
      balance: 0,
      userId: user.id,
    },
  });

  revalidatePath("/wallets");
}

export async function deleteWallet(formData: FormData) {
  const id = formData.get("id") as string;

  await prisma.wallet.delete({ where: { id } });

  revalidatePath("/wallets");
}