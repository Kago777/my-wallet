import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DashboardChart from "@/components/DashboardChart";
import MonthlyChart from "@/components/MonthlyChart";
import { getSessionUser } from "@/auth.server";
import { redirect } from "next/navigation";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ walletId?: string; granularity?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const userId = user.id;
  const { walletId, granularity = "month" } = await searchParams;

  const wallets = await prisma.wallet.findMany({
    where: { userId },
  });

  const walletFilter = walletId
    ? { wallet: { userId, id: walletId } }
    : { wallet: { userId } };

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

  // 粒度に応じた集計期間を生成
const now = new Date();
let periods: { label: string; start: Date; end: Date }[] = [];

if (granularity === "month") {
  periods = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return {
      label: `${d.getMonth() + 1}月`,
      start: d,
      end,
    };
  });
} else if (granularity === "week") {
  periods = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(now);
    start.setDate(now.getDate() - (11 - i) * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return {
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      start,
      end,
    };
  });
} else if (granularity === "3days") {
  periods = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(now);
    start.setDate(now.getDate() - (11 - i) * 3);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 3);
    return {
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      start,
      end,
    };
  });
}

const monthlyData = await Promise.all(
  periods.map(async ({ label, start, end }) => {
    const income = await prisma.transaction.aggregate({
      where: { ...walletFilter, type: "income", date: { gte: start, lt: end } },
      _sum: { amount: true },
    });
    const expense = await prisma.transaction.aggregate({
      where: { ...walletFilter, type: "expense", date: { gte: start, lt: end } },
      _sum: { amount: true },
    });
    return {
      label,
      income: income._sum.amount ?? 0,
      expense: expense._sum.amount ?? 0,
    };
  })
);

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        {/* 財布切り替え */}
        <div className="flex gap-2">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              background: !walletId ? "var(--emerald-500)" : "var(--navy-800)",
              color: !walletId ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--navy-600)",
            }}>
            すべて
          </Link>
          {wallets.map((w) => (
            <Link
              key={w.id}
              href={`/?walletId=${w.id}`}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                background: walletId === w.id ? "var(--emerald-500)" : "var(--navy-800)",
                color: walletId === w.id ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--navy-600)",
              }}>
              {w.name}
            </Link>
          ))}
        </div>

        <Link href="/transactions/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--emerald-500)", color: "#fff" }}>
          <Plus size={16} />
          収支を追加
        </Link>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "残高", value: balance, color: "var(--text-primary)" },
          { label: "収入", value: totalIncome._sum.amount ?? 0, color: "var(--emerald-400)" },
          { label: "支出", value: totalExpense._sum.amount ?? 0, color: "var(--red-400)" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-6"
            style={{ background: "var(--navy-800)", border: "1px solid var(--navy-600)" }}>
            <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>{item.label}</p>
            <p className="text-2xl font-bold" style={{ color: item.color }}>
              ¥{item.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* グラフ */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl p-6"
          style={{ background: "var(--navy-800)", border: "1px solid var(--navy-600)" }}>
          <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
            カテゴリ別支出
          </h2>
          <DashboardChart data={chartData} />
        </div>

        <div className="rounded-xl p-6"
          style={{ background: "var(--navy-800)", border: "1px solid var(--navy-600)" }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              直近の取引
            </h2>
            <Link href="/transactions"
              className="text-xs" style={{ color: "var(--emerald-400)" }}>
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
                      {t.type === "income"
                        ? <TrendingUp size={14} />
                        : <TrendingDown size={14} />
                      }¥{t.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 月別グラフ */}
      <div className="rounded-xl p-6"
        style={{ background: "var(--navy-800)", border: "1px solid var(--navy-600)" }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
          月別収支
        </h2>
        <MonthlyChart data={monthlyData} granularity={granularity} />
      </div>
    </main>
  );
}