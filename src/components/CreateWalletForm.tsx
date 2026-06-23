"use client";

import { useState } from "react";
import { WalletTypeSelector } from "@/components/WalletTypeSelector";
import { CreditCardSettingForm } from "@/components/CreditCardSettingForm";
import { WalletType } from "@/generated/prisma/client";

type BankWallet = {
  id: string;
  name: string;
};

export function CreateWalletForm({
  action,
  bankWallets,
}: {
  action: (fd: FormData) => Promise<void>;
  bankWallets: BankWallet[];
}) {
  const [walletType, setWalletType] = useState<WalletType>("cash");

  return (
    <form action={action} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="財布の名前（例：現金・楽天銀行）"
        className="input w-full"
        required
      />

      <WalletTypeSelector name="type" defaultValue="cash" onChange={setWalletType} />

      {walletType === "credit" && (
        <CreditCardSettingForm bankWallets={bankWallets} />
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn-primary px-6 py-3"
          disabled={walletType === "credit" && bankWallets.length === 0}
        >
          追加
        </button>
      </div>
    </form>
  );
}
