import { requireAuth } from "@/auth.server";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getCategoriesForUser, getWalletsForUser } from "@/lib/queries";
import ReceiptEditForm from "@/components/ReceiptEditForm";

export default async function ReceiptEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { receiptItems: true, wallet: true },
  });

  if (!transaction || transaction.wallet.userId !== user.id) notFound();
  if (transaction.receiptItems.length === 0) notFound();

  const [categories, wallets] = await Promise.all([
    getCategoriesForUser(user.id),
    getWalletsForUser(user.id),
  ]);

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-8">内訳を編集</h1>
      <ReceiptEditForm
        transactionId={transaction.id}
        initialData={{
          store: transaction.description,
          date: new Date(transaction.date).toISOString().split("T")[0],
          items: transaction.receiptItems.map((item) => ({
            name: item.name,
            amount: item.amount,
          })),
          total: transaction.amount,
        }}
        initialCategoryId={transaction.categoryId}
        initialWalletId={transaction.walletId}
        categories={categories}
        wallets={wallets}
        onRetake={null} // 編集時は再撮影不要
      />
    </main>
  );
}