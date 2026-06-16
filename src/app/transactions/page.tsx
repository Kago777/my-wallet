import { prisma } from "@/lib/db";
import Link from "next/link";
import { deleteTransaction } from "@/app/actions/transaction";
import CategoryFilter from "@/components/CategoryFilter";
import { requireAuth } from "@/auth.server";
import { getCategoriesForUser } from "@/lib/queries";
import { Pencil, Trash2, Plus, TrendingUp, TrendingDown, LucideArrowUpDown, ArrowLeftRight, ArrowRight } from "lucide-react";
import { deleteTransfer } from "@/app/actions/transfer";
import TransactionActions from "@/components/TransactionActions";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; categoryId?: string }>;
}) {
  const user = await requireAuth();
  const { type, categoryId } = await searchParams;

  const categories = await getCategoriesForUser(user.id);

  // ── Transaction一覧取得 ──────────────────────────────
  // typeが"transfer"のときはTransactionクエリを走らせない
  // receiptItemsはIDのみ取得して件数確認に使う
  const transactions = await prisma.transaction.findMany({
    where: {
      wallet: { userId: user.id },
      // "transfer"はTransactionTypeに存在しないので除外
      ...(type && type !== "transfer" ? { type: type as "income" | "expense" } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: true,
      wallet: true,
      receiptItems: { select: { id: true } }, // 件数確認用（内容は不要）
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  // ── Transfer一覧取得 ─────────────────────────────────
  // 振替タブ選択時のみ取得する
  const transfers = type === "transfer"
    ? await prisma.transfer.findMany({
        where: { userId: user.id },
        include: { fromWallet: true, toWallet: true },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      })
    : [];

  return (
    <main className="p-4 sm:p-8 max-w-6xl mx-auto">

      {/* ── ヘッダー ── */}
      <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="font-display text-2xl font-bold">収支一覧</h1>
        <Link href="/transactions/new" className="btn-primary flex items-center gap-2 px-3 sm:px-4 py-2">
          <Plus size={16} />
          追加
        </Link>
      </div>

      {/* ── タブフィルター ── */}
      <div className="flex items-center gap-3 sm:flex-row sm:items-center mb-6">
        <div className="flex gap-2 items-center overflow-x-auto scrollbar-hidden flex-nowrap w-full sm:w-auto">
          {[
            { label: "すべて", value: "" },
            { label: "収入", value: "income" },
            { label: "支出", value: "expense" },
            { label: "振替", value: "transfer" },
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
        {/* カテゴリフィルターは振替タブ以外で表示 */}
        {type !== "transfer" && (
          <div className="ml-auto mt-2 sm:mt-0 flex-shrink-0">
            <CategoryFilter categories={categories} />
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        {type === "transfer" ? (
          // ══════════════════════════════════════
          // 振替一覧（Transferモデルのデータ）
          // receiptItemsは存在しない
          // ══════════════════════════════════════
          <>
            {/* 振替 Mobile */}
            <div className="md:hidden">
              {transfers.length === 0 ? (
                <p className="text-center py-6 text-sm" style={{ color: "var(--text-muted)" }}>振替がありません</p>
              ) : (
                <div className="space-y-2 p-3">
                  {transfers.map((t) => (
                    <div key={t.id} className="rounded-xl p-4"
                      style={{
                        background: "rgba(99,102,241,0.07)",
                        border: "0.5px solid rgba(99,102,241,0.25)",
                      }}>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          {/* 送金元 → 送金先 */}
                          <p className="text-sm font-medium flex items-center gap-1">
                            {t.fromWallet.name}
                            <ArrowRight size={14} />
                            {t.toWallet.name}
                          </p>
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            {new Date(t.date).toLocaleDateString("ja-JP")}
                            {t.description ? ` · ${t.description}` : ""}
                          </p>
                        </div>
                        <p className="text-2xl font-semibold" style={{ color: "var(--navy-400)" }}>
                          ¥{t.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {/* 振替 Mobile */}
                        <TransactionActions
                          editHref={`/transactions/${t.id}/transfer_edit`}
                          deleteAction={deleteTransfer}
                          deleteId={t.id}
                          deleteMessage="この振替を削除しますか？"
                          variant="desktop"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 振替 Desktop */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--navy-600)" }}>
                    {["日付", "送金元", "送金先", "メモ", "金額", "操作"].map((h) => (
                      <th key={h} className="text-left px-6 py-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>振替がありません</td>
                    </tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t.id} style={{ borderBottom: "1px solid var(--navy-600)" }} className="transition-colors hover:bg-slate-700">
                        <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                          {new Date(t.date).toLocaleDateString("ja-JP")}
                        </td>
                        <td className="px-6 py-4 text-sm">{t.fromWallet.name}</td>
                        <td className="px-6 py-4 text-sm">{t.toWallet.name}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: "var(--text-muted)" }}>{t.description ?? "-"}</td>
                        <td className="px-6 py-4 text-sm font-semibold">
                          ¥{t.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-4 items-center">
                           <TransactionActions
                            editHref={`/transactions/${t.id}/transfer_edit`}
                            deleteAction={deleteTransfer}
                            deleteId={t.id}
                            deleteMessage="この振替を削除しますか？"
                            variant="desktop"
                          />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          // ══════════════════════════════════════
          // 収支一覧（Transactionモデルのデータ）
          // receiptItemsの件数で編集先を振り分ける
          // ══════════════════════════════════════
          <>
            {/* 収支 Mobile */}
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
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-sm font-medium">{t.category.name}</p>
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            {new Date(t.date).toLocaleDateString("ja-JP")} · {t.wallet.name}
                            {t.description ? ` · ${t.description}` : ""}
                          </p>
                        </div>
                        <p className="text-2xl font-semibold"
                          style={{ color: t.type === "income" ? "var(--emerald-400)" : "var(--red-400)" }}>
                          {t.type === "income" ? "+" : "-"}¥{t.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {/* レシートあり → receipt/edit、なし → 通常edit */}
                        {/* 収支 Mobile */}
                            <TransactionActions
                              editHref={
                                t.receiptItems.length > 1
                                  ? `/transactions/${t.id}/receipt/edit`
                                  : `/transactions/${t.id}/edit`
                              }
                              deleteAction={deleteTransaction}
                              deleteId={t.id}
                              deleteMessage="このトランザクションを削除しますか？"
                              variant="mobile"
                            />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 収支 Desktop */}
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
                          <div className="flex items-center gap-1"
                            style={{ color: t.type === "income" ? "var(--emerald-400)" : "var(--red-400)" }}>
                            {t.type === "income" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            ¥{t.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-4 items-center">
                            {/* レシートあり → receipt/edit、なし → 通常edit */}
                            {/* 収支 Desktop */}
                            <TransactionActions
                              editHref={
                                t.receiptItems.length > 1
                                  ? `/transactions/${t.id}/receipt/edit`
                                  : `/transactions/${t.id}/edit`
                              }
                              deleteAction={deleteTransaction}
                              deleteId={t.id}
                              deleteMessage="このトランザクションを削除しますか？"
                              variant="desktop"
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}