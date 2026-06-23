// src/components/ReceiptNewClient.tsx
"use client";

import { useState } from "react";
import ReceiptCamera from "@/components/ReceiptCamera";
import ReceiptEditForm from "@/components/ReceiptEditForm";
import { CategoryType, WalletType } from "@/generated/prisma/client";

type Category = { id: string; name: string; type: CategoryType };
type Wallet   = { id: string; name: string; type: WalletType };
type ReceiptData = {
  store: string | null;
  date: string | null;
  items: { name: string; amount: number }[];
  subtotal?: number | null;
  tax?: number | null;
  total: number;
};

type Props = {
  categories: Category[];
  wallets: Wallet[];
};

export default function ReceiptNewClient({ categories, wallets }: Props) {
  const [phase, setPhase]           = useState<"camera" | "edit">("camera");
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  if (phase === "camera") {
    return (
      <ReceiptCamera
        onCapture={(data) => {
          setReceiptData(data);
          setPhase("edit");
        }}
        onClose={() => window.history.back()}
      />
    );
  }

  if (phase === "edit" && receiptData) {
    return (
      <ReceiptEditForm
        initialData={receiptData}
        categories={categories}
        wallets={wallets}
        onRetake={() => {
          setReceiptData(null);
          setPhase("camera");
        }}
      />
    );
  }

  return null;
}