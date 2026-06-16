import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { requireAuth } from "@/auth.server";
import TransferForm from "@/components/TransferForm";
import { getWalletsForUser } from "@/lib/queries";

export default async function EditTransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const transfer = await prisma.transfer.findUnique({ where: { id } });
  if (!transfer || transfer.userId !== user.id) notFound();

  const wallets = await getWalletsForUser(user.id);

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-8">振替を編集</h1>
      <TransferForm
        wallets={wallets}
        defaultValues={{
          id: transfer.id,
          fromWalletId: transfer.fromWalletId,
          toWalletId: transfer.toWalletId,
          amount: transfer.amount,
          date: new Date(transfer.date).toISOString().split("T")[0],
          description: transfer.description ?? "",
        }}
      />
    </main>
  );
}