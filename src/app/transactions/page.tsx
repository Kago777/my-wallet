import { prisma } from "@/lib/db";
import Link from "next/link";
import { deleteTransaction } from "@/app/actions/transaction";
import CategoryFilter from "@/components/CategoryFilter";
import { requireAuth } from "@/auth.server";
import { getCategoriesForUser } from "@/lib/queries";
import { Pencil, Trash2, Plus, TrendingUp, TrendingDown } from "lucide-react";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; categoryId?: string }>;
}) {
  const user = await requireAuth();
  const { type, categoryId } = await searchParams;

  const categories = await getCategoriesForUser(user.id);

  const transactions = await prisma.transaction.findMany({
    where: {
      wallet: { userId: user.id },
      ...(type ? { type: type as "income" | "expense" } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    include: { category: true, wallet: true },
    orderBy: { date: "desc" },
  });

  return (
    <main className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="font-display text-2xl font-bold">収支一覧</h1>
        <Link href="/transactions/new" className="btn-primary flex items-center gap-2 px-3 sm:px-4 py-2">
          <Plus size={16} />
          追加
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:flex-row sm:items-center mb-6">
        <div className="flex gap-2 items-center overflow-x-auto scrollbar-hidden flex-nowrap w-full sm:w-auto">
        {[
          { label: "すべて", value: "" },
          { label: "収入", value: "income" },
          { label: "支出", value: "expense" },
        ].map((item) => (
          <Link
            key={item.value}
            href={item.value ? `/transactions?type=${item.value}` : "/transactions"}
            className={`btn-filter flex-shrink-0 ${
              type === item.value || (!type && !item.value)
                ? "btn-filter-active"
                : "btn-filter-inactive"
            }`}>
            {item.label}
          </Link>
        ))}
        </div>
        <div className="ml-auto mt-2 sm:mt-0 flex-shrink-0">
          <CategoryFilter categories={categories} />
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Mobile list view */}
        <div className="md:hidden">
          {transactions.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: "var(--text-muted)" }}>取引がありません</p>
          ) : (
            <div className="space-y-2 p-3">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl p-4"
                  style={{
                    background: t.type === "income" ? "rgba(16,185,129,0.07)" : "rgba(248,113,113,0.07)",
                    border: `0.5px solid ${t.type === "income" ? "rgba(16,185,129,0.25)" : "rgba(248,113,113,0.2)"}`,
                  }}
                >
                  {/* 上段：カテゴリ・日付 ↔ 金額 */}
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-sm font-medium">{t.category.name}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {new Date(t.date).toLocaleDateString("ja-JP")} · {t.wallet.name}
                        {t.description ? ` · ${t.description}` : ""}
                      </p>
                    </div>
                    <p
                      className="text-2xl font-semibold"
                      style={{ color: t.type === "income" ? "var(--emerald-400)" : "var(--red-400)" }}
                    >
                      {t.type === "income" ? "+" : "-"}¥{t.amount.toLocaleString()}
                    </p>
                  </div>

                  {/* ボタン */}
                  <div className="flex gap-2">
                    <Link
                      href={`/transactions/${t.id}/edit`}
                      className="flex-1 text-center py-2 rounded-lg text-sm font-medium"
                      style={{
                        background: "var(--navy-700)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--navy-600)",
                      }}
                    >
                      編集
                    </Link>
                    <form action={deleteTransaction} className="flex-1">
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        className="w-full py-2 rounded-lg text-sm font-medium"
                        style={{
                          background: "rgba(248,113,113,0.1)",
                          color: "var(--red-400)",
                          border: "1px solid rgba(248,113,113,0.3)",
                        }}
                      >
                        削除
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--navy-600)" }}>
                {["日付", "カテゴリ", "財布", "メモ", "金額", "操作"].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
                    取引がありません
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--navy-600)" }} className="transition-colors hover:bg-slate-700">
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {new Date(t.date).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-6 py-4 text-sm">{t.category.name}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {t.wallet.name}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                      {t.description ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      <div className="flex items-center gap-1" style={{ color: t.type === "income" ? "var(--emerald-400)" : "var(--red-400)" }}>
                        {t.type === "income" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        ¥{t.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-4 items-center">
                        <Link href={`/transactions/${t.id}/edit`} className="flex items-center gap-1 hover:opacity-80" style={{ color: "var(--blue-400)" }}>
                          <Pencil size={14} />
                          編集
                        </Link>
                        <form action={deleteTransaction} className="inline">
                          <input type="hidden" name="id" value={t.id} />
                          <button type="submit" className="flex items-center gap-1 hover:opacity-80" style={{ color: "var(--red-400)" }}>
                            <Trash2 size={14} />
                            削除
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
