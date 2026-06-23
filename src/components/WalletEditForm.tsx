"use client";

import { useState } from "react";
import Link from "next/link";
import { WalletTypeSelector } from "@/components/WalletTypeSelector";
import { CreditCardSettingForm } from "@/components/CreditCardSettingForm";
import { WalletType } from "@/generated/prisma/client";

type BankWallet = {
  id: string;
  name: string;
};

type CreditCardSettingValues = {
  billingDay: number;
  closingDay: number | null;
  settlementWalletId: string;
  billingMonthOffset: number;
};

type Props = {
  walletId: string;
  name: string;
  type: WalletType;
  bankWallets: BankWallet[];
  creditCardSetting?: CreditCardSettingValues | null;
  updateAction: (fd: FormData) => Promise<void>;
};

export function WalletEditForm({
  walletId,
  name,
  type: initialType,
  bankWallets,
  creditCardSetting,
  updateAction,
}: Props) {
  const [walletType, setWalletType] = useState<WalletType>(initialType);

  return (
    <form action={updateAction} className="space-y-6">
      <input type="hidden" name="id" value={walletId} />

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          財布名
        </label>
        <input
          id="name"
          type="text"
          name="name"
          defaultValue={name}
          placeholder="財布の名前（例：現金・楽天銀行）"
          className="input w-full"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">
          タイプ
        </label>
        <WalletTypeSelector defaultValue={initialType} name="type" onChange={setWalletType} />
      </div>

      {walletType === "credit" && (
        <CreditCardSettingForm
          bankWallets={bankWallets}
          defaultValues={creditCardSetting ?? undefined}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="btn-primary px-4 py-3"
          disabled={walletType === "credit" && bankWallets.length === 0}
        >
          更新
        </button>
        <Link href="/wallets" className="btn-secondary px-4 py-3">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
