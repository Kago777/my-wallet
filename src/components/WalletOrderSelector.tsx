"use client";

import Link from "next/link";
import { DragEvent, useEffect, useRef, useState } from "react";
import { WalletIcon } from "@/components/WalletIcon";

type WalletOption = {
  id: string;
  name: string;
  type: "cash" | "bank" | "credit" | "investment";
};

function areIdsEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

export default function WalletOrderSelector({
  wallets,
  selectedWalletId,
}: {
  wallets: WalletOption[];
  selectedWalletId?: string;
}) {
  const [orderedWallets, setOrderedWallets] = useState(wallets);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initialOrderRef = useRef(wallets.map((wallet) => wallet.id));

  useEffect(() => {
    setOrderedWallets(wallets);
    initialOrderRef.current = wallets.map((wallet) => wallet.id);
  }, [wallets]);

  const saveOrder = async (orderIds: string[]) => {
    setSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/wallets/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: orderIds }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "並び替えの保存に失敗しました");
      }

      initialOrderRef.current = orderIds;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, walletId: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", walletId);
    setDraggingId(walletId);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, overId: string) => {
    event.preventDefault();
    if (!draggingId || draggingId === overId) return;

    setOrderedWallets((current) => {
      const sourceIndex = current.findIndex((wallet) => wallet.id === draggingId);
      const targetIndex = current.findIndex((wallet) => wallet.id === overId);
      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    const newOrder = orderedWallets.map((wallet) => wallet.id);
    if (!areIdsEqual(initialOrderRef.current, newOrder)) {
      void saveOrder(newOrder);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center overflow-x-auto scrollbar-hidden flex-nowrap pb-2">
        <Link
          href="/"
          className={`btn-filter flex-shrink-0 ${!selectedWalletId ? "btn-filter-active" : "btn-filter-inactive"}`}>
          すべて
        </Link>
        {orderedWallets.map((wallet) => (
          <div
            key={wallet.id}
            draggable
            onDragStart={(event) => handleDragStart(event, wallet.id)}
            onDragOver={(event) => handleDragOver(event, wallet.id)}
            onDragEnd={handleDragEnd}
            className={`flex flex-shrink-0 items-center gap-2 rounded-full border px-3 py-2 bg-slate-950/10 transition ${
              draggingId === wallet.id ? "opacity-75 border-blue-400" : "border-transparent"
            }`}>
            <Link
              href={`/?walletId=${wallet.id}`}
              className={`flex items-center gap-1 text-sm ${selectedWalletId === wallet.id ? "font-semibold text-blue-500" : "text-slate-100"}`}>
              <WalletIcon type={wallet.type} className="h-4 w-4 text-emerald-400" />
              {wallet.name}
            </Link>
          </div>
        ))}
      </div>
      {saving ? (
        <p className="text-xs text-muted">並び替えを保存中です…</p>
      ) : errorMessage ? (
        <p className="text-xs text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  );
}
