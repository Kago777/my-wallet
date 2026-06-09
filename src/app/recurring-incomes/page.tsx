import { prisma } from "@/lib/db";
import { requireAuth } from "@/auth.server";
import {
  createRecurringIncome,
  deleteRecurringIncome,
} from "@/app/actions/recurring-income";
import { getCategoriesForUser, getWalletsForUser } from "@/lib/queries";
import { cycleTypeLabel } from "@/lib/labels";

export default async function RecurringIncomesPage() {
  const user = await requireAuth();

  const [recurringIncomes, categories, wallets] = await Promise.all([
    prisma.recurringIncome.findMany({
      where: { wallet: { userId: user.id } },
      include: { category: true, wallet: true },
      orderBy: { cycleDay: "asc" },
    }),
    getCategoriesForUser(user.id),
    getWalletsForUser(user.id),
  ]);

  const totalMonthly = recurringIncomes
    .filter((r) => r.cycleType === "monthly")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-display text-2xl font-bold">定期収入管理</h1>
      </div>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        月額合計：
        <span className="font-semibold ml-1" style={{ color: "var(--emerald-400)" }}>
          ¥{totalMonthly.toLocaleString()}
        </span>
      </p>

      <div className="card p-6 mb-8">
        <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
          定期収入を追加
        </h2>
        <form action={createRecurringIncome} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>名前</label>
              <input type="text" name="name" placeholder="給料・家賃収入等"
                className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>金額</label>
              <input type="number" name="amount" placeholder="0" className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>サイクル</label>
              <select name="cycleType" className="select">
                <option value="monthly">毎月</option>
                <option value="weekly">毎週</option>
                <option value="yearly">毎年</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>日付</label>
              <input type="number" name="cycleDay" min="1" max="31" placeholder="1〜31"
                className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>開始日</label>
              <input type="date" name="startDate" className="input"
                defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>終了日（任意）</label>
              <input type="date" name="endDate" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>カテゴリ</label>
              <select name="categoryId" className="select">
                {categories.map((c) => (
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
        {recurringIncomes.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
            定期収入がありません
          </p>
        ) : (
          recurringIncomes.map((r) => (
            <div key={r.id} className="card px-6 py-5 flex justify-between items-center">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  {cycleTypeLabel(r.cycleType)}{r.cycleDay}日　・　{r.category.name}　・　{r.wallet.name}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <p className="font-semibold" style={{ color: "var(--emerald-400)" }}>
                  ¥{r.amount.toLocaleString()}
                </p>
                <form action={deleteRecurringIncome}>
                  <input type="hidden" name="id" value={r.id} />
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
