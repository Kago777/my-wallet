import { prisma } from "@/lib/db";
import { requireAuth } from "@/auth.server";
import { createRecurringBill, deleteRecurringBill } from "@/app/actions/recurring-bill";
import { getCategoriesForUser, getWalletsForUser } from "@/lib/queries";
import { EqualApproximately } from "lucide-react";

const CYCLE_LABEL = {
  monthly: "毎月",
  weekly: "毎週",
  yearly: "毎年",
};

export default async function RecurringBillsPage() {
  const user = await requireAuth();

  const [bills, categories, wallets] = await Promise.all([
    prisma.recurringBill.findMany({
      where: { wallet: { userId: user.id }, isActive: true },
      include: { category: true, wallet: true },
      orderBy: { createdAt: "asc" },
    }),
    getCategoriesForUser(user.id),
    getWalletsForUser(user.id),
  ]);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <main className="p-4 sm:p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-8">変動費管理</h1>

      <div className="card p-6 mb-8">
        <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
          変動費を追加
        </h2>
        <form action={createRecurringBill} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>名前</label>
              <input type="text" name="name" placeholder="水道料金・ガス料金等"
                className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>推定金額</label>
              <input type="number" name="estimatedAmount" placeholder="0"
                className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>引き落とし日（任意）</label>
              <input type="number" name="billingDay" placeholder="1〜31"
                className="input" min="1" max="31" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>サイクル</label>
              <select name="cycleType" className="select">
                <option value="monthly">毎月</option>
                <option value="yearly">毎年</option>
                <option value="weekly">毎週</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>提供元（任意）</label>
              <input type="text" name="provider" placeholder="東京電力・つくば市等"
                className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>カテゴリ</label>
              <select name="categoryId" className="select">
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>財布</label>
              <select name="walletId" className="select">
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-3">
            追加
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {bills.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
            変動費がありません
          </p>
        ) : (
          bills.map((b) => (
            <div key={b.id} className="card px-6 py-5 flex justify-between items-center">
              <div>
                <p className="font-medium">{b.name}</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  {CYCLE_LABEL[b.cycleType]}
                  {b.billingDay ? `${b.billingDay}日` : ""}
                  　・　{b.category.name}　・　{b.wallet.name}
                  {b.provider ? `　・　${b.provider}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                  <EqualApproximately />¥{b.estimatedAmount.toLocaleString()}
                </p>
                <form action={deleteRecurringBill}>
                  <input type="hidden" name="id" value={b.id} />
                  <button type="submit" className="text-sm" style={{ color: "var(--red-400)" }}>
                    削除
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}