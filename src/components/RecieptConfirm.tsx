"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type ReceiptItem = {
  name: string;
  amount: number;
};

type ReceiptData = {
  store: string | null;
  date: string | null;
  items: ReceiptItem[];
  total: number;
};

type Props = {
  data: ReceiptData;
  walletId: string;
  categoryId: string;
  onConfirm: (data: ReceiptData) => Promise<void>;
  onRetake: () => void;
};

export default function ReceiptConfirm({
  data,
  onConfirm,
  onRetake,
}: Props) {
  const [store, setStore] = useState(data.store ?? "");
  const [date, setDate] = useState(
    data.date ?? new Date().toISOString().split("T")[0]
  );
  const [items, setItems] = useState<ReceiptItem[]>(data.items);
  const [loading, setLoading] = useState(false);

  // 合計を内訳から動的に計算
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  // 内訳の編集
  const updateItem = (index: number, field: keyof ReceiptItem, value: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [field]: field === "amount" ? Number(value) : value }
          : item
      )
    );
  };

  // 内訳の削除
  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // 内訳の追加
  const addItem = () => {
    setItems((prev) => [...prev, { name: "", amount: 0 }]);
  };

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm({ store: store || null, date, items, total });
  };

  return (
    <div className="card p-6 space-y-6">

      {/* ヘッダー */}
      <div>
        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
          読み取り結果を確認・修正してください
        </p>
      </div>

      {/* 店名・日付 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>店名（任意）</p>
          <input
            type="text"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            className="input"
            placeholder="店名"
          />
        </div>
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>日付</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
        </div>
      </div>

      {/* 内訳一覧 */}
      <div>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>内訳</p>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              {/* 商品名 */}
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(index, "name", e.target.value)}
                className="input flex-1"
                placeholder="商品名"
              />
              {/* 金額 */}
              <div className="flex items-center gap-1"
                style={{ border: "1px solid var(--navy-600)", borderRadius: "0.5rem", padding: "0.5rem" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>¥</span>
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateItem(index, "amount", e.target.value)}
                  className="bg-transparent outline-none w-20 text-sm"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
              {/* 削除 */}
              <button
                type="button"
                onClick={() => removeItem(index)}
                style={{ color: "var(--red-400)" }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* 追加ボタン */}
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

      {/* 合計 */}
      <div
        className="flex justify-between items-center p-4 rounded-xl"
        style={{ background: "var(--navy-700)" }}
      >
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>合計</p>
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          ¥{total.toLocaleString()}
        </p>
      </div>

      {/* ボタン */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRetake}
          className="flex-1 py-3 rounded-lg text-sm font-semibold"
          style={{
            background: "var(--navy-700)",
            color: "var(--text-secondary)",
            border: "1px solid var(--navy-600)",
          }}
        >
          撮り直す
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || items.length === 0}
          className="flex-1 py-3 rounded-lg text-sm font-semibold"
          style={{
            background: "var(--emerald-500)",
            color: "#fff",
            opacity: loading || items.length === 0 ? 0.7 : 1,
          }}
        >
          {loading ? "保存中..." : "この内容で保存"}
        </button>
      </div>
    </div>
  );
}