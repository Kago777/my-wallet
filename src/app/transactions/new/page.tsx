import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/auth.server";
import { redirect } from "next/navigation";
import TransactionForm from "@/components/TransactionForm";

export default async function NewTransactionPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const userId = user.id;

  const categories = await prisma.category.findMany({
    where: { OR: [{ isDefault: true }, { userId }] },
  });

  const wallets = await prisma.wallet.findMany({
    where: { userId },
  });

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-8">収支を入力</h1>
      <TransactionForm categories={categories} wallets={wallets} />
    </main>
  );
}