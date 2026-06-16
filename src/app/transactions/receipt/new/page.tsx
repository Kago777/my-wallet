// src/app/transactions/receipt/new/page.tsx
import { requireAuth } from "@/auth.server";
import { getCategoriesForUser, getWalletsForUser } from "@/lib/queries";
import ReceiptNewClient from "@/components/ReceiptNewClient";

export default async function ReceiptNewPage() {
  const user = await requireAuth();
  const [categories, wallets] = await Promise.all([
    getCategoriesForUser(user.id),
    getWalletsForUser(user.id),
  ]);

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-8">レシートを読み取る</h1>
      <ReceiptNewClient categories={categories} wallets={wallets} />
    </main>
  );
}