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
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-2xl font-bold">収支一覧</h1>
        <Link href="/transactions/new" className="btn-primary flex items-center gap-2 px-4 py-2">
          <Plus size={16} />
          追加
        </Link>
      </div>

      <div className="flex gap-3 mb-6 items-center">
        {[
          { label: "すべて", value: "" },
          { label: "収入", value: "income" },
          { label: "支出", value: "expense" },
        ].map((item) => (
          <Link
            key={item.value}
            href={item.value ? `/transactions?type=${item.value}` : "/transactions"}
            className={`btn-filter ${
              type === item.value || (!type && !item.value)
                ? "btn-filter-active"
                : "btn-filter-inactive"
            }`}>
            {item.label}
          </Link>
        ))}
        <div className="ml-auto">
          <CategoryFilter categories={categories} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--navy-600)" }}>
              {["日付", "カテゴリ", "財布", "メモ", "金額", "操作"].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm"
                  style={{ color: "var(--text-muted)" }}>
                  取引がありません
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--navy-600)" }}
                  className="transition-colors hover:bg-slate-700">
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
                    <div className="flex items-center gap-1"
                      style={{ color: t.type === "income" ? "var(--emerald-400)" : "var(--red-400)" }}>
                      {t.type === "income" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      ¥{t.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-4 items-center">
                      <Link href={`/transactions/${t.id}/edit`}
                        className="flex items-center gap-1 hover:opacity-80"
                        style={{ color: "var(--blue-400)" }}>
                        <Pencil size={14} />
                        編集
                      </Link>
                      <form action={deleteTransaction} className="inline">
                        <input type="hidden" name="id" value={t.id} />
                        <button type="submit"
                          className="flex items-center gap-1 hover:opacity-80"
                          style={{ color: "var(--red-400)" }}>
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
    </main>
  );
}
