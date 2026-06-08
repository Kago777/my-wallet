import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/auth.server";
import { redirect } from "next/navigation";
import { createRecurringIncome, deleteRecurringIncome } from "@/app/actions/recurringIncome";

const cycleTypeLabel = (type: string) => {
  if (type === "monthly") return "毎月";
  if (type === "weekly") return "毎週";
  return "毎年";
};

export default async function RecurringIncomesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const recurringIncomes = await prisma.recurringIncome.findMany({
    where: { wallet: { userId: user.id } },
    include: { category: true, wallet: true },
    orderBy: { cycleDay: "asc" },
  });

  const categories = await prisma.category.findMany({
    where: { OR: [{ isDefault: true }, { userId: user.id }] },
  });

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
  });

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

      {/* 追加フォーム */}
      <div className="rounded-xl p-6 mb-8"
        style={{ background: "var(--navy-800)", border: "1px solid var(--navy-600)" }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
          定期収入を追加
        </h2>
        <form action={createRecurringIncome} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>名前</label>
              <input type="text" name="name" placeholder="給料・家賃収入等"
                className="w-full rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
                  color: "var(--text-primary)" }} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>金額</label>
              <input type="number" name="amount" placeholder="0"
                className="w-full rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
                  color: "var(--text-primary)" }} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>サイクル</label>
              <select name="cycleType" className="w-full rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
                  color: "var(--text-primary)" }}>
                <option value="monthly">毎月</option>
                <option value="weekly">毎週</option>
                <option value="yearly">毎年</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>日付</label>
              <input type="number" name="cycleDay" min="1" max="31" placeholder="1〜31"
                className="w-full rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
                  color: "var(--text-primary)" }} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>開始日</label>
              <input type="date" name="startDate"
                className="w-full rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
                  color: "var(--text-primary)" }}
                defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>終了日（任意）</label>
              <input type="date" name="endDate"
                className="w-full rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
                  color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>カテゴリ</label>
              <select name="categoryId" className="w-full rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
                  color: "var(--text-primary)" }}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>財布</label>
              <select name="walletId" className="w-full rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
                  color: "var(--text-primary)" }}>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit"
            className="w-full py-3 rounded-lg text-sm font-semibold"
            style={{ background: "var(--emerald-500)", color: "#fff" }}>
            追加
          </button>
        </form>
      </div>

      {/* 一覧 */}
      <div className="space-y-3">
        {recurringIncomes.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
            定期収入がありません
          </p>
        ) : (
          recurringIncomes.map((r) => (
            <div key={r.id} className="rounded-xl px-6 py-5 flex justify-between items-center"
              style={{ background: "var(--navy-800)", border: "1px solid var(--navy-600)" }}>
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