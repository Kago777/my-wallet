import { prisma } from "@/lib/db";
import { requireAuth } from "@/auth.server";
import { createWallet, deleteWallet } from "@/app/actions/wallet";
import { walletTypeLabel } from "@/lib/labels";

export default async function WalletsPage() {
  const user = await requireAuth();

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    include: { _count: { select: { transactions: true } } },
  });

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-8">財布・口座管理</h1>

      <div className="card p-6 mb-8">
        <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
          財布を追加
        </h2>
        <form action={createWallet} className="flex gap-3">
          <input type="text" name="name"
            placeholder="財布の名前（例：現金・楽天銀行）"
            className="input flex-1" required />
          <select name="type" className="select w-auto">
            <option value="cash">現金</option>
            <option value="bank">銀行</option>
            <option value="credit">クレジット</option>
          </select>
          <button type="submit" className="btn-primary px-4 py-3">
            追加
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {wallets.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
            財布がありません。追加してください。
          </p>
        ) : (
          wallets.map((w) => (
            <div key={w.id} className="card px-6 py-5 flex justify-between items-center">
              <div>
                <p className="font-medium">{w.name}</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  {walletTypeLabel(w.type)}　・　{w._count.transactions}件の取引
                </p>
              </div>
              <form action={deleteWallet}>
                <input type="hidden" name="id" value={w.id} />
                <button type="submit"
                  className="text-sm"
                  style={{ color: w._count.transactions > 0 ? "var(--text-muted)" : "var(--red-400)" }}
                  disabled={w._count.transactions > 0}>
                  {w._count.transactions > 0 ? "削除不可" : "削除"}
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
