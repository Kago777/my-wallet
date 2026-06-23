import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/auth.server";
import { createWallet, deleteWallet } from "@/app/actions/wallet";
import { walletTypeLabel } from "@/lib/labels";
import { CreateWalletForm } from "@/components/CreateWalletForm";
import { WalletIcon } from "@/components/WalletIcon";

export default async function WalletsPage() {
  const user = await requireAuth();

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const bankWallets = wallets
    .filter((w) => w.type === "bank")
    .map((w) => ({ id: w.id, name: w.name }));

  // Calculate wallet balances
  const walletBalanceGroups = await prisma.transaction.groupBy({
    by: ["walletId", "type"],
    where: { wallet: { userId: user.id } },
    _sum: { amount: true },
  });

  const walletBalanceMap = new Map<string, number>();
  walletBalanceGroups.forEach((group) => {
    const current = walletBalanceMap.get(group.walletId) ?? 0;
    const amount = group._sum.amount ?? 0;
    const sign = group.type === "income" ? 1 : -1;
    walletBalanceMap.set(group.walletId, current + amount * sign);
  });

  const walletIds = wallets.map((w) => w.id);

  const [transfersIn, transfersOut] = await Promise.all([
    prisma.transfer.groupBy({
      by: ["toWalletId"],
      where: { toWalletId: { in: walletIds } },
      _sum: { amount: true },
    }),
    prisma.transfer.groupBy({
      by: ["fromWalletId"],
      where: { fromWalletId: { in: walletIds } },
      _sum: { amount: true },
    }),
  ]);

  transfersIn.forEach((t) => {
    const current = walletBalanceMap.get(t.toWalletId) ?? 0;
    walletBalanceMap.set(t.toWalletId, current + (t._sum.amount ?? 0));
  });
  transfersOut.forEach((t) => {
    const current = walletBalanceMap.get(t.fromWalletId) ?? 0;
    walletBalanceMap.set(t.fromWalletId, current - (t._sum.amount ?? 0));
  });

  // Check which wallets have transactions (for delete button)
  const walletTransactionCounts = await prisma.transaction.groupBy({
    by: ["walletId"],
    where: { wallet: { userId: user.id } },
    _count: true,
  });

  const transactionCountMap = new Map<string, number>();
  walletTransactionCounts.forEach((group) => {
    transactionCountMap.set(group.walletId, group._count);
  });

  return (
    <main className="p-4 sm:p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-8">財布・口座管理</h1>

      <div className="card p-6 mb-8">
        <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
          財布を追加
        </h2>
        <CreateWalletForm action={createWallet} bankWallets={bankWallets} />
      </div>

      <div className="space-y-2">
        {wallets.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
            財布がありません。追加してください。
          </p>
        ) : (
          wallets.map((w) => {
            const balance = walletBalanceMap.get(w.id) ?? 0;
            const hasTransactions = (transactionCountMap.get(w.id) ?? 0) > 0;
            return (
              <div
                key={w.id}
                className="rounded-xl p-4"
                style={{
                  background: "var(--navy-800)",
                  border: "1px solid var(--navy-600)",
                }}
              >
                {/* 上段：名前・メタ情報 ↔ 残高 */}
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <WalletIcon type={w.type} className="h-4 w-4 text-slate-400" />
                      <p className="text-sm font-medium">{w.name}</p>
                    </div>
                  </div>
                  <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    ¥{Math.abs(balance).toLocaleString()}
                  </p>
                </div>

                {/* ボタン */}
                <div className="flex gap-2">
                  <Link
                    href={`/wallets/${w.id}/edit`}
                    className="flex-1 text-center py-2 rounded-lg text-sm font-medium"
                    style={{
                      background: "var(--navy-700)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--navy-600)",
                    }}
                  >
                    編集
                  </Link>
                  <form action={deleteWallet} className="flex-1">
                    <input type="hidden" name="id" value={w.id} />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg text-sm font-medium"
                      disabled={hasTransactions}
                      style={hasTransactions ? {
                        opacity: 0.35,
                        border: "1px solid var(--navy-600)",
                        color: "var(--text-muted)",
                      } : {
                        background: "rgba(248,113,113,0.1)",
                        color: "var(--red-400)",
                        border: "1px solid rgba(248,113,113,0.3)",
                      }}
                    >
                      {hasTransactions ? "削除不可" : "削除"}
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
