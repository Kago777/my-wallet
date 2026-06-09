import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { requireAuth } from "@/auth.server";
import TransactionForm from "@/components/TransactionForm";
import { getCategoriesForUser, getWalletsForUser } from "@/lib/queries";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { wallet: true },
  });

  if (!transaction || transaction.wallet.userId !== user.id) notFound();

  const [categories, wallets] = await Promise.all([
    getCategoriesForUser(user.id),
    getWalletsForUser(user.id),
  ]);

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-8">収支を編集</h1>
      <TransactionForm
        categories={categories}
        wallets={wallets}
        defaultValues={{
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          categoryId: transaction.categoryId,
          walletId: transaction.walletId,
          date: new Date(transaction.date).toISOString().split("T")[0],
          description: transaction.description ?? "",
        }}
      />
    </main>
  );
}
