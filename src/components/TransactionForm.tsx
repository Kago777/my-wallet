"use client";

import { useState } from "react";
import Link from "next/link";
import { CategoryType, TransactionType, WalletType } from "@/generated/prisma/client";

type Category = {
  id: string;
  name: string;
  type: CategoryType;
};

type Wallet = {
  id: string;
  name: string;
  type: WalletType;
};

type Props = {
  categories: Category[];
  wallets: Wallet[];
  defaultValues?: {
    id: string;
    type: TransactionType;
    amount: number;
    categoryId: string;
    walletId: string;
    date: string;
    description: string;
  };
};

// ① TransactionTypeに"transfer"を加えたFormMode型を定義
type FormMode = TransactionType | "transfer";

export default function TransactionForm({ categories, wallets, defaultValues }: Props) {
  const isEdit = !!defaultValues;

  const getNeutralCategoryId = (transactionType: TransactionType) => {
    return (
      categories.find((c) => c.type === transactionType && c.name === "その他")?.id ??
      categories.find((c) => c.type === transactionType)?.id ??
      ""
    );
  };

  // ② modeを追加、typeは収支フォーム内部専用として存続
  const [mode, setMode] = useState<FormMode>(defaultValues?.type ?? "expense");
  const [type, setType] = useState<TransactionType>(defaultValues?.type ?? "expense");
  const [amount, setAmount] = useState(
    defaultValues?.amount ? String(defaultValues.amount) : ""
  );
  const [categoryId, setCategoryId] = useState(
    defaultValues?.categoryId ?? getNeutralCategoryId(defaultValues?.type ?? "expense")
  );
  const [walletId, setWalletId] = useState(
    defaultValues?.walletId ?? wallets[0]?.id ?? ""
  );
  // ③ 振替用の2財布state
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id ?? "");
  const [toWalletId, setToWalletId]     = useState(wallets[1]?.id ?? "");
  const [date, setDate] = useState(
    defaultValues?.date ?? new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [loading, setLoading] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  // ④ handleSubmitにtransfer分岐を追加
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "transfer") {
      if (fromWalletId === toWalletId) {
        alert("送金元と送金先が同じです");
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("fromWalletId", fromWalletId);
      formData.append("toWalletId", toWalletId);
      formData.append("amount", amount);
      formData.append("date", date);
      formData.append("description", description);

      const { createTransfer } = await import("@/app/actions/transfer");
      await createTransfer(formData);
    } else {
      const selectedCategoryId = categoryId || getNeutralCategoryId(type);
      const formData = new FormData();
      if (isEdit) formData.append("id", defaultValues.id);
      formData.append("type", type);
      formData.append("amount", amount);
      formData.append("categoryId", selectedCategoryId);
      formData.append("walletId", walletId);
      formData.append("date", date);
      formData.append("description", description);

      if (isEdit) {
        const { updateTransaction } = await import("@/app/actions/transaction");
        await updateTransaction(formData);
      } else {
        const { createTransaction } = await import("@/app/actions/transaction");
        await createTransaction(formData);
      }
    }
  };

  return (
    <div className="card p-8">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ⑤ タブ：grid-cols-3に変更、振替ボタン追加、アクティブ判定をmodeに変更 */}
        <div className={`grid ${isEdit ? "grid-cols-2" : "grid-cols-3"} rounded-lg overflow-hidden`}
          style={{ border: "1px solid var(--navy-600)" }}>
          <button
            type="button"
            onClick={() => {
              setMode("expense");
              setType("expense");
              setCategoryId(getNeutralCategoryId("expense"));
            }}
            className="py-3 text-sm font-semibold transition-colors"
            style={{
              background: mode === "expense" ? "var(--red-400)" : "var(--navy-700)",
              color: mode === "expense" ? "#fff" : "var(--text-muted)",
            }}>
            支出
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("income");
              setType("income");
              setCategoryId(getNeutralCategoryId("income"));
            }}
            className="py-3 text-sm font-semibold transition-colors"
            style={{
              background: mode === "income" ? "var(--emerald-500)" : "var(--navy-700)",
              color: mode === "income" ? "#fff" : "var(--text-muted)",
            }}>
            収入
          </button>
          {!isEdit && (
            <button
              type="button"
              onClick={() => setMode("transfer")}
              className="py-3 text-sm font-semibold transition-colors"
              style={{
                background: mode === "transfer" ? "var(--navy-400)" : "var(--navy-700)",
                color: mode === "transfer" ? "#fff" : "var(--text-muted)",
              }}>
              振替
            </button>
          )}
        </div>

        {/* 金額（変更なし） */}
        <div className="rounded-xl p-6 card" style={{ background: "var(--navy-700)" }}>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>金額</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold" style={{ color: "var(--text-muted)" }}>¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 text-4xl font-bold bg-transparent outline-none"
              style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
              placeholder="0"
              required
            />
          </div>
        </div>

        {/* ⑥ カテゴリ：振替時に非表示 */}
        {mode !== "transfer" && (
          <div>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>カテゴリ</p>
            <div className="overflow-x-auto pb-2 scrollbar-hidden">
              {filteredCategories.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  カテゴリがありません
                </p>
              ) : (
                <div className="flex gap-2 min-w-max">
                  {filteredCategories.map((c) => {
                    const currentSelectedId = categoryId || getNeutralCategoryId(type);
                    const isActive = currentSelectedId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategoryId(c.id)}
                        className="flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap"
                        style={{
                          background: isActive
                            ? type === "expense" ? "var(--red-400)" : "var(--emerald-500)"
                            : "var(--navy-700)",
                          color: isActive ? "#fff" : "var(--text-secondary)",
                          border: "1px solid var(--navy-600)",
                        }}>
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ⑦ 財布・日付：振替時に送金元・送金先へ差し替え */}
        {mode === "transfer" ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>送金元</p>
                <select value={fromWalletId} onChange={(e) => setFromWalletId(e.target.value)} className="select">
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>送金先</p>
                <select value={toWalletId} onChange={(e) => setToWalletId(e.target.value)} className="select">
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>日付</p>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="input" required />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>財布</p>
              <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="select">
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>日付</p>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="input" required />
            </div>
          </div>
        )}

        {/* メモ（変更なし） */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>メモ（任意）</p>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            className="input" placeholder="任意" />
        </div>

        {/* ⑧ 送信ボタン：backgroundをmode依存に変更 */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background:
                mode === "transfer" ? "var(--emerald-500)"
                : mode === "expense"  ? "var(--red-400)"
                : "var(--emerald-500)",
              color: "#fff",
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? "保存中..." : isEdit ? "更新" : "保存"}
          </button>
          {isEdit && (
            <Link href="/transactions"
              className="flex-1 py-3 rounded-lg text-sm font-semibold text-center"
              style={{ background: "var(--navy-700)", color: "var(--text-secondary)",
                border: "1px solid var(--navy-600)" }}>
              キャンセル
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}