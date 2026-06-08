import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/auth.server";
import TransactionForm from "@/components/TransactionForm";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const userId = user.id;
  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { wallet: true },
  });

  if (!transaction || transaction.wallet.userId !== userId) notFound();

  const categories = await prisma.category.findMany({
    where: { OR: [{ isDefault: true }, { userId }] },
  });

  const wallets = await prisma.wallet.findMany({
    where: { userId },
  });

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-8">収支を編集</h1>
      <TransactionForm
        categories={categories}
        wallets={wallets}
        defaultValues={{
          id: transaction.id,
          type: transaction.type as "expense" | "income",
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