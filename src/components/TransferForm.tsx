"use client";

import { useState } from "react";
import Link from "next/link";
import { WalletType } from "@/generated/prisma/client";


type Wallet = {
  id: string;
  name: string;
  type: WalletType;
};

type Props = {
  wallets: Wallet[];
  defaultValues: {
    id: string;
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    date: string;
    description: string;
  };
};

export default function TransferForm({ wallets, defaultValues }: Props) {
  const [fromWalletId, setFromWalletId] = useState(defaultValues.fromWalletId);
  const [toWalletId, setToWalletId]     = useState(defaultValues.toWalletId);
  const [amount, setAmount]             = useState(String(defaultValues.amount));
  const [date, setDate]                 = useState(defaultValues.date);
  const [description, setDescription]   = useState(defaultValues.description);
  const [loading, setLoading]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromWalletId === toWalletId) {
      alert("送金元と送金先が同じです");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("id", defaultValues.id);
    formData.append("fromWalletId", fromWalletId);
    formData.append("toWalletId", toWalletId);
    formData.append("amount", amount);
    formData.append("date", date);
    formData.append("description", description);

    const { updateTransfer } = await import("@/app/actions/transfer");
    await updateTransfer(formData);
  };

  return (
    <div className="card p-8">
      <form onSubmit={handleSubmit} className="space-y-6">

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

        <div>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>メモ（任意）</p>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            className="input" placeholder="任意" />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: "var(--emerald-500)",
              color: "#fff",
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? "保存中..." : "更新"}
          </button>
          <Link href="/transactions?type=transfer"
            className="flex-1 py-3 rounded-lg text-sm font-semibold text-center"
            style={{ background: "var(--navy-700)", color: "var(--text-secondary)", border: "1px solid var(--navy-600)" }}>
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}