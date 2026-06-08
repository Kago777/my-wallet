"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  type: string;
};

type Wallet = {
  id: string;
  name: string;
  type: string;
};

type Props = {
  categories: Category[];
  wallets: Wallet[];
  defaultValues?: {
    id: string;
    type: "expense" | "income";
    amount: number;
    categoryId: string;
    walletId: string;
    date: string;
    description: string;
  };
};

export default function TransactionForm({ categories, wallets, defaultValues }: Props) {
  const router = useRouter();
  const isEdit = !!defaultValues;

  const [type, setType] = useState<"expense" | "income">(
    defaultValues?.type ?? "expense"
  );
  const [amount, setAmount] = useState(
    defaultValues?.amount ? String(defaultValues.amount) : ""
  );
  const [categoryId, setCategoryId] = useState(defaultValues?.categoryId ?? "");
  const [walletId, setWalletId] = useState(
    defaultValues?.walletId ?? wallets[0]?.id ?? ""
  );
  const [date, setDate] = useState(
    defaultValues?.date ?? new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [loading, setLoading] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    if (isEdit) formData.append("id", defaultValues.id);
    formData.append("type", type);
    formData.append("amount", amount);
    formData.append("categoryId", (categoryId || filteredCategories[0]?.id) ?? "");
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

    router.push("/transactions");
  };

  return (
    <div className="rounded-xl p-8"
      style={{ background: "var(--navy-800)", border: "1px solid var(--navy-600)" }}>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 収支切り替え */}
        <div className="grid grid-cols-2 rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--navy-600)" }}>
          <button type="button" onClick={() => { setType("expense"); setCategoryId(""); }}
            className="py-3 text-sm font-semibold transition-colors"
            style={{
              background: type === "expense" ? "var(--red-400)" : "var(--navy-700)",
              color: type === "expense" ? "#fff" : "var(--text-muted)",
            }}>
            支出
          </button>
          <button type="button" onClick={() => { setType("income"); setCategoryId(""); }}
            className="py-3 text-sm font-semibold transition-colors"
            style={{
              background: type === "income" ? "var(--emerald-500)" : "var(--navy-700)",
              color: type === "income" ? "#fff" : "var(--text-muted)",
            }}>
            収入
          </button>
        </div>

        {/* 金額 */}
        <div className="rounded-xl p-6"
          style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)" }}>
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

        {/* カテゴリ pills */}
        <div>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>カテゴリ</p>
          <div className="flex flex-wrap gap-2">
            {filteredCategories.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                カテゴリがありません
              </p>
            ) : (
              filteredCategories.map((c) => {
                const isActive = categoryId === c.id ||
                  (!categoryId && filteredCategories[0]?.id === c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className="px-4 py-2 rounded-full text-sm transition-colors"
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
              })
            )}
          </div>
        </div>

        {/* 財布・日付 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>財布</p>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
                color: "var(--text-primary)" }}>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>日付</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
                color: "var(--text-primary)" }}
              required
            />
          </div>
        </div>

        {/* メモ */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>メモ（任意）</p>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm"
            style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)",
              color: "var(--text-primary)" }}
            placeholder="任意"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: type === "expense" ? "var(--red-400)" : "var(--emerald-500)",
              color: "#fff",
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? "保存中..." : isEdit ? "更新" : "保存"}
          </button>
          {isEdit && (
            <a href="/transactions"
              className="flex-1 py-3 rounded-lg text-sm font-semibold text-center"
              style={{ background: "var(--navy-700)", color: "var(--text-secondary)",
                border: "1px solid var(--navy-600)" }}>
              キャンセル
            </a>
          )}
        </div>
      </form>
    </div>
  );
}