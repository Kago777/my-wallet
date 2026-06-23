import Link from "next/link";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/auth.server";
import { assertWalletOwnership } from "@/lib/authorization";
import { updateWallet } from "@/app/actions/wallet";
import { walletTypeLabel } from "@/lib/labels";
import { WalletEditForm } from "@/components/WalletEditForm";

interface WalletEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function WalletEditPage({ params }: WalletEditPageProps) {
  const user = await requireAuth();
  const { id } = await params;
  const wallet = await assertWalletOwnership(id, user.id);

  const [bankWallets, creditCardSetting] = await Promise.all([
    prisma.wallet.findMany({
      where: { userId: user.id, type: "bank" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.creditCardSetting.findUnique({
      where: { walletId: id },
    }),
  ]);

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/wallets" className="text-sm text-blue-600 hover:underline">
          ← 財布一覧へ戻る
        </Link>
      </div>

      <div className="card p-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold mb-4">財布情報の編集</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            現在のタイプ: {walletTypeLabel(wallet.type)}
          </p>
        </div>

        <WalletEditForm
          walletId={wallet.id}
          name={wallet.name}
          type={wallet.type}
          bankWallets={bankWallets}
          creditCardSetting={creditCardSetting}
          updateAction={updateWallet}
        />
      </div>
    </main>
  );
}
