import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/auth.server";
import { redirect } from "next/navigation";
import { createWallet, deleteWallet } from "@/app/actions/wallet";

const walletTypeLabel = (type: string) => {
  if (type === "cash") return "現金";
  if (type === "bank") return "銀行";
  return "クレジット";
};

export default async function WalletsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    include: { _count: { select: { transactions: true } } },
  });

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-8">財布・口座管理</h1>

      {/* 追加フォーム */}
      <div className="rounded-xl p-6 mb-8"
        style={{ background: "var(--navy-800)", border: "1px solid var(--navy-600)" }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
          財布を追加
        </h2>
        <form action={createWallet} className="flex gap-3">
          <input type="text" name="name"
            placeholder="財布の名前（例：現金・楽天銀行）"
            className="flex-1 rounded-lg px-4 py-3 text-sm"
            style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
              color: "var(--text-primary)" }}
            required />
          <select name="type" className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
              color: "var(--text-primary)" }}>
            <option value="cash">現金</option>
            <option value="bank">銀行</option>
            <option value="credit">クレジット</option>
          </select>
          <button type="submit"
            className="px-4 py-3 rounded-lg text-sm font-semibold"
            style={{ background: "var(--emerald-500)", color: "#fff" }}>
            追加
          </button>
        </form>
      </div>

      {/* 財布一覧 */}
      <div className="space-y-3">
        {wallets.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
            財布がありません。追加してください。
          </p>
        ) : (
          wallets.map((w) => (
            <div key={w.id} className="rounded-xl px-6 py-5 flex justify-between items-center"
              style={{ background: "var(--navy-800)", border: "1px solid var(--navy-600)" }}>
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