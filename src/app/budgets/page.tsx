import { prisma } from "@/lib/db";
import { requireAuth } from "@/auth.server";
import { createBudget, deleteBudget } from "@/app/actions/budget";
import { getCategoriesForUser, getWalletsForUser } from "@/lib/queries";
import { getMonthRange } from "@/lib/date";

export default async function BudgetsPage() {
  const user = await requireAuth();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { start, end } = getMonthRange(currentMonth);

  const [budgets, categories, wallets, actuals] = await Promise.all([
    prisma.budget.findMany({
      where: { wallet: { userId: user.id }, month: currentMonth },
      include: { category: true, wallet: true },
    }),
    getCategoriesForUser(user.id),
    getWalletsForUser(user.id),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        wallet: { userId: user.id },
        type: "expense",
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
  ]);

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-display text-2xl font-bold">予算管理</h1>
      </div>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>{currentMonth}</p>

      <div className="card p-6 mb-8">
        <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
          予算を設定
        </h2>
        <form action={createBudget} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>月</label>
              <input type="month" name="month" className="input"
                defaultValue={currentMonth} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>予算金額</label>
              <input type="number" name="amount" placeholder="0" className="input" required />
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
            設定
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {budgets.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
            予算が設定されていません
          </p>
        ) : (
          budgets.map((b) => {
            const actual = actuals.find((a) => a.categoryId === b.categoryId)?._sum.amount ?? 0;
            const percent = Math.min(Math.round((actual / b.amount) * 100), 100);
            const isOver = actual > b.amount;

            return (
              <div key={b.id} className="card px-6 py-5">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-medium">{b.category.name}</p>
                  <div className="flex items-center gap-6">
                    <p className="text-sm">
                      <span className="font-semibold"
                        style={{ color: isOver ? "var(--red-400)" : "var(--text-primary)" }}>
                        ¥{actual.toLocaleString()}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        {" / "}¥{b.amount.toLocaleString()}
                      </span>
                    </p>
                    <form action={deleteBudget}>
                      <input type="hidden" name="id" value={b.id} />
                      <button type="submit" className="text-sm" style={{ color: "var(--red-400)" }}>
                        削除
                      </button>
                    </form>
                  </div>
                </div>
                <div className="w-full rounded-full h-2" style={{ background: "var(--navy-700)" }}>
                  <div className="h-2 rounded-full transition-all"
                    style={{
                      width: `${percent}%`,
                      background: isOver ? "var(--red-400)" : "var(--emerald-500)",
                    }} />
                </div>
                <p className="text-xs mt-2"
                  style={{ color: isOver ? "var(--red-400)" : "var(--text-muted)" }}>
                  {isOver
                    ? `予算超過 ¥${(actual - b.amount).toLocaleString()}`
                    : `残り ¥${(b.amount - actual).toLocaleString()}`}
                </p>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
