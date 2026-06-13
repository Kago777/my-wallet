import { prisma } from "@/lib/db";
import Link from "next/link";
import DashboardChart from "@/components/DashboardChart";
import MonthlyChart from "@/components/MonthlyChart";
import WalletOrderSelector from "@/components/WalletOrderSelector";
import { requireAuth } from "@/auth.server";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { aggregateByPeriods, buildPeriods } from "@/lib/periods";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ walletId?: string; granularity?: string }>;
}) {
  const user = await requireAuth();
  const { walletId, granularity = "month" } = await searchParams;

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const walletFilter = walletId
    ? { wallet: { userId: user.id, id: walletId } }
    : { wallet: { userId: user.id } };

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

  const walletShareData = wallets
    .map((w) => ({
      name: w.name,
      amount: Math.max(0, walletBalanceMap.get(w.id) ?? 0),
    }))
    .filter((item) => item.amount > 0);

  const transactions = await prisma.transaction.findMany({
    where: walletFilter,
    include: { category: true },
    orderBy: { date: "desc" },
    take: 5,
  });

  const totalIncome = await prisma.transaction.aggregate({
    where: { type: "income", ...walletFilter },
    _sum: { amount: true },
  });

  const totalExpense = await prisma.transaction.aggregate({
    where: { type: "expense", ...walletFilter },
    _sum: { amount: true },
  });

  const balance = (totalIncome._sum.amount ?? 0) - (totalExpense._sum.amount ?? 0);

  const expenseByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { type: "expense", ...walletFilter },
    _sum: { amount: true },
  });

  const categories = await prisma.category.findMany();
  const chartData = expenseByCategory.map((e) => ({
    name: categories.find((c) => c.id === e.categoryId)?.name ?? "不明",
    amount: e._sum.amount ?? 0,
  }));

  const periods = buildPeriods(granularity);
  const periodStart = periods[0]?.start;
  const periodTransactions =
    periods.length > 0
      ? await prisma.transaction.findMany({
          where: {
            ...walletFilter,
            date: { gte: periodStart },
          },
          select: { type: true, amount: true, date: true },
        })
      : [];

  const monthlyData = aggregateByPeriods(periodTransactions, periods);

  return (
    <main className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-center lg:justify-between">
        <WalletOrderSelector wallets={wallets} selectedWalletId={walletId} />
        <Link href="/transactions/new" className="btn-primary flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2">
          <Plus size={16} />
          収支を追加
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        {[
          { label: "残高", value: balance, color: "var(--text-primary)" },
          { label: "収入", value: totalIncome._sum.amount ?? 0, color: "var(--emerald-400)" },
          { label: "支出", value: totalExpense._sum.amount ?? 0, color: "var(--red-400)" },
        ].map((item) => (
          <div key={item.label} className="card p-6">
            <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>{item.label}</p>
            <p className="text-2xl font-bold" style={{ color: item.color }}>
              ¥{item.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {!walletId ? (
        <div className="card p-6 mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
            <h2 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              全財産の財布ごとの割合
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              取引ベースで推定した財布残高の割合
            </p>
          </div>
          <DashboardChart data={walletShareData} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 mb-6 lg:grid-cols-2">
        <div className="card p-6 order-2 lg:order-1">
          <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
            カテゴリ別支出
          </h2>
          <DashboardChart data={chartData} />
        </div>

        <div className="card p-6 order-1 lg:order-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              直近の取引
            </h2>
            <Link href="/transactions" className="text-xs" style={{ color: "var(--emerald-400)" }}>
              すべて見る
            </Link>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>取引がありません</p>
          ) : (
            <ul>
              {transactions.map((t) => (
                <li key={t.id} className="flex justify-between py-3"
                  style={{ borderBottom: "1px solid var(--navy-600)" }}>
                  <div>
                    <p className="text-sm">{t.category.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {new Date(t.date).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold"
                    style={{ color: t.type === "income" ? "var(--emerald-400)" : "var(--red-400)" }}>
                    {t.type === "income" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    ¥{t.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
          月別収支
        </h2>
        <MonthlyChart data={monthlyData} granularity={granularity} />
      </div>
    </main>
  );
}
