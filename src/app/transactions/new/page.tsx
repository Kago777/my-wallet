import { requireAuth } from "@/auth.server";
import TransactionForm from "@/components/TransactionForm";
import { getCategoriesForUser, getWalletsForUser } from "@/lib/queries";

export default async function NewTransactionPage() {
  const user = await requireAuth();

  const [categories, wallets] = await Promise.all([
    getCategoriesForUser(user.id),
    getWalletsForUser(user.id),
  ]);

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-8">収支を入力</h1>
      <TransactionForm categories={categories} wallets={wallets} />
    </main>
  );
}
