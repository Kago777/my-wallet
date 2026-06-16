"use client";

import { useState, useCallback } from "react";
import { Trash2, Plus, RefreshCw } from "lucide-react";
import { CategoryType, WalletType } from "@/generated/prisma/client";

type Category = { id: string; name: string; type: CategoryType };
type Wallet   = { id: string; name: string; type: WalletType };

type ReceiptItem = {
  name: string;
  amount: number;
  split: boolean;          // 除外して別保存するか
  splitCategoryId: string; // 除外時のカテゴリ
};

type ReceiptData = {
  store: string | null;
  date: string | null;
  items: { name: string; amount: number }[];
  total: number;
};

type Props = {
  initialData: ReceiptData;
  categories: Category[];
  wallets: Wallet[];
  onRetake: (() => void) | null;        // nullのとき再撮影ボタン非表示
  transactionId?: string;               // 編集時のみ
  initialCategoryId?: string;           // 編集時の初期カテゴリ
  initialWalletId?: string;             // 編集時の初期財布
};

export default function ReceiptEditForm({
  initialData,
  categories,
  wallets,
  onRetake,
  transactionId,
  initialCategoryId,
  initialWalletId,
}: Props) {
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const isEdit = !!transactionId;
  const getNeutralCategoryId = () =>
    expenseCategories.find((c) => c.name === "その他")?.id ??
    expenseCategories[0]?.id ?? "";

  const [store, setStore]   = useState(initialData.store ?? "");
  const [date, setDate]     = useState(
    initialData.date ?? new Date().toISOString().split("T")[0]
  );
  const [items, setItems]   = useState<ReceiptItem[]>(
    initialData.items.map((item) => ({
      ...item,
      split: false,
      splitCategoryId: getNeutralCategoryId(),
    }))
  );
  const [mainCategoryId, setMainCategoryId] = useState(initialCategoryId ?? getNeutralCategoryId());
  const [walletId, setWalletId]             = useState(initialWalletId ?? wallets[0]?.id ?? "");
  const [loading, setLoading]               = useState(false);

  // メイン合計（splitでない項目のみ）
  const mainTotal = items
    .filter((item) => !item.split)
    .reduce((sum, item) => sum + item.amount, 0);

  const updateItem = (index: number, field: keyof ReceiptItem, value: string | boolean) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "amount" ? Number(value) : value,
            }
          : item
      )
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { name: "", amount: 0, split: false, splitCategoryId: getNeutralCategoryId() },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const mainItems  = items.filter((item) => !item.split);
    const splitItems = items.filter((item) => item.split).map((item) => ({
      name: item.name,
      amount: item.amount,
      categoryId: item.splitCategoryId,
    }));

    const formData = new FormData();
    formData.append("walletId",       walletId);
    formData.append("mainCategoryId", mainCategoryId);
    formData.append("date",           date);
    formData.append("store",          store);
    formData.append("mainItems",      JSON.stringify(mainItems));
    formData.append("splitItems",     JSON.stringify(splitItems));

    if (transactionId) {
      // 編集モード
      formData.append("transactionId", transactionId);
      const { updateReceiptItems } = await import("@/app/actions/transaction");
      await updateReceiptItems(formData);
    } else {
      // 新規作成モード
      const { createReceiptTransactions } = await import("@/app/actions/transaction");
      await createReceiptTransactions(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* 再撮影ボタン */}
      {onRetake && (
        <button
          type="button"
          onClick={onRetake}
          className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
          style={{
            background: "var(--navy-700)",
            color: "var(--text-secondary)",
            border: "1px solid var(--navy-600)",
          }}
        >    
          <RefreshCw size={14} />
          再撮影・再読み取り
        </button>
      )}

      {/* 店名 */}
      <div>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>店名（任意）</p>
        <input
          type="text"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="input w-full"
          placeholder="店名"
        />
      </div>

      {/* 日付 */}
      <div>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>日付</p>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input w-full"
          required
        />
      </div>

      {/* 内訳一覧 */}
      <div>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>内訳</p>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl p-4 space-y-3"
              style={{
                background: item.split ? "rgba(99,102,241,0.07)" : "var(--navy-700)",
                border: `1px solid ${item.split ? "rgba(99,102,241,0.3)" : "var(--navy-600)"}`,
              }}
            >
              {/* 商品名 */}
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>商品名</p>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  className="input w-full"
                  placeholder="商品名"
                />
              </div>

              {/* 金額 */}
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>金額</p>
                <div
                  className="flex items-center gap-1 rounded-lg px-3 py-2"
                  style={{ border: "1px solid var(--navy-600)", background: "var(--navy-800)" }}
                >
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>¥</span>
                  <input
                    type="number"
                    value={item.amount === 0 ? "" : item.amount}
                    onChange={(e) => updateItem(index, "amount", e.target.value)}
                    className="bg-transparent outline-none flex-1 text-sm"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              {/* 除外チェックボックス */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.split}
                  onChange={(e) => updateItem(index, "split", e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  別のトランザクションとして保存
                </span>
              </label>

              {/* 除外時のカテゴリ選択 */}
              {item.split && (
                <div>
                  <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>カテゴリ</p>
                  <div className="overflow-x-auto pb-1 scrollbar-hidden">
                    <div className="flex gap-2 min-w-max">
                      {expenseCategories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => updateItem(index, "splitCategoryId", c.id)}
                          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap"
                          style={{
                            background: item.splitCategoryId === c.id
                              ? "var(--red-400)"
                              : "var(--navy-800)",
                            color: item.splitCategoryId === c.id ? "#fff" : "var(--text-secondary)",
                            border: "1px solid var(--navy-600)",
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 削除 */}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--red-400)" }}
              >
                <Trash2 size={12} />
                削除
              </button>
            </div>
          ))}
        </div>

        {/* 項目追加 */}
        <button
          type="button"
          onClick={addItem}
          className="mt-3 flex items-center gap-1 text-sm"
          style={{ color: "var(--emerald-400)" }}
        >
          <Plus size={14} />
          項目を追加
        </button>
      </div>

      {/* メイン合計 */}
      <div
        className="flex justify-between items-center p-4 rounded-xl"
        style={{ background: "var(--navy-700)" }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>合計</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            別保存分を除く
          </p>
        </div>
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          ¥{mainTotal.toLocaleString()}
        </p>
      </div>

      {/* メインカテゴリ */}
      <div>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>カテゴリ</p>
        <div className="overflow-x-auto pb-2 scrollbar-hidden">
          <div className="flex gap-2 min-w-max">
            {expenseCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setMainCategoryId(c.id)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap"
                style={{
                  background: mainCategoryId === c.id ? "var(--red-400)" : "var(--navy-700)",
                  color: mainCategoryId === c.id ? "#fff" : "var(--text-secondary)",
                  border: "1px solid var(--navy-600)",
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 財布 */}
      <div>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>財布</p>
        <select
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
          className="select w-full"
        >
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* 保存ボタン */}
      <button
        type="submit"
        disabled={loading || items.filter((i) => !i.split).length === 0}
        className="w-full py-3 rounded-lg text-sm font-semibold"
        style={{
          background: "var(--red-400)",
          color: "#fff",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "保存中..." : isEdit ? "更新" : "保存"}
      </button>
    </form>
  );
}