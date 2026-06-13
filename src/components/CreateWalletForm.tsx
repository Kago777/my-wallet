"use client";

import { WalletTypeSelector } from "@/components/WalletTypeSelector";

export function CreateWalletForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  return (
    <form action={action} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="財布の名前（例：現金・楽天銀行）"
        className="input w-full"
        required
      />

      <WalletTypeSelector name="type" defaultValue="cash" />

      <div className="flex justify-end">
        <button type="submit" className="btn-primary px-6 py-3">
          追加
        </button>
      </div>
    </form>
  );
}
