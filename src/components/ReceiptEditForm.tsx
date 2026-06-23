"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Trash2, Plus, RefreshCw } from "lucide-react";
import { CategoryType, WalletType } from "@/generated/prisma/client";

type Category = { id: string; name: string; type: CategoryType; parentId?: string | null };

function CategoryPicker({
  categories,
  selectedId,
  onChange,
}: {
  categories: Category[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const isParentActive = (parentId: string) =>
    selectedId === parentId ||
    categories.find((c) => c.id === selectedId)?.parentId === parentId ||
    categories.find((c) => {
      const parent = categories.find((p) => p.id === c.parentId);
      return c.id === selectedId && parent?.parentId === parentId;
    }) !== undefined;

  const selectedCategory = categories.find((c) => c.id === selectedId);
  const level2ParentId = selectedCategory?.parentId ?? selectedId;
  const level2 = categories.filter((c) => c.parentId === level2ParentId);
  const level3 = selectedCategory?.parentId
    ? categories.filter((c) => c.parentId === selectedId)
    : [];

  return (
    <div>
      {/* 1階層目 */}
      <div className="overflow-x-auto pb-2 scrollbar-hidden mb-3">
        <div className="flex gap-2 min-w-max">
          {categories
            .filter((c) => !c.parentId)
            .map((c) => {
              const active = isParentActive(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChange(c.id)}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap"
                  style={{
                    background: active ? "var(--red-400)" : "var(--navy-700)",
                    color: active ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--navy-600)",
                  }}>
                  {c.name}
                </button>
              );
            })}
        </div>
      </div>

      {/* 2階層目 */}
      {level2.length > 0 && (
        <div className="overflow-x-auto pb-2 scrollbar-hidden mb-3">
          <div className="flex gap-2 min-w-max">
            {level2.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange(c.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap"
                style={{
                  background: selectedId === c.id ? "var(--red-400)" : "var(--navy-800)",
                  color: selectedId === c.id ? "#fff" : "var(--text-secondary)",
                  border: "1px solid var(--navy-600)",
                }}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3階層目 */}
      {level3.length > 0 && (
        <div className="overflow-x-auto pb-2 scrollbar-hidden">
          <div className="flex gap-2 min-w-max">
            {level3.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange(c.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap"
                style={{
                  background: selectedId === c.id ? "var(--red-400)" : "var(--navy-800)",
                  color: selectedId === c.id ? "#fff" : "var(--text-muted)",
                  border: "1px solid var(--navy-700)",
                }}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
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
  subtotal?: number | null;
  tax?: number | null;
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

// #region agent log
function DateInputDebug() {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState<Record<string, string | number> | null>(null);
  useEffect(() => {
    const inp = inputRef.current;
    const wrap = wrapperRef.current;
    if (!inp || !wrap) return;
    setInfo({
      inp_offset: inp.offsetWidth,
      inp_scroll: inp.scrollWidth,
      wrap_offset: wrap.offsetWidth,
      boxSizing: getComputedStyle(inp).boxSizing,
      minWidth: getComputedStyle(inp).minWidth,
      paddingL: getComputedStyle(inp).paddingLeft,
      paddingR: getComputedStyle(inp).paddingRight,
      bodyW: document.body.offsetWidth,
    });
  }, []);
  return (
    <div ref={wrapperRef}>
      <input ref={inputRef} type="date" style={{ visibility: 'hidden', position: 'absolute', pointerEvents: 'none' }} className="input w-full" readOnly />
      {info && (
        <pre style={{ fontSize: 9, color: 'lime', background: '#000', padding: 4, wordBreak: 'break-all', whiteSpace: 'pre-wrap', marginBottom: 4 }}>
          {JSON.stringify(info, null, 1)}
        </pre>
      )}
    </div>
  );
}
// #endregion

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
  const [items, setItems]   = useState<ReceiptItem[]>(() => {
    const base = initialData.items.map((item) => ({
      ...item,
      split: false,
      splitCategoryId: getNeutralCategoryId(),
    }));
    if (initialData.tax && initialData.tax > 0) {
      base.push({ name: "消費税", amount: initialData.tax, split: false, splitCategoryId: getNeutralCategoryId() });
    }
    return base;
  });
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
        {/* #region agent log */}
        <DateInputDebug />
        {/* #endregion */}
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
                  <CategoryPicker
                    categories={expenseCategories}
                    selectedId={item.splitCategoryId}
                    onChange={(id) => updateItem(index, "splitCategoryId", id)}
                  />
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
        <CategoryPicker
          categories={expenseCategories}
          selectedId={mainCategoryId}
          onChange={setMainCategoryId}
        />
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