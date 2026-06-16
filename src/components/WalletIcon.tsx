"use client";

import { CircleDollarSign, Landmark, Wallet, ChartNoAxesCombined } from "lucide-react";
import { WalletType } from "@/generated/prisma/client";

export function WalletIcon({
  type,
  className,
}: {
  type: WalletType;
  className?: string;
}) {
  if (type === "cash") {
    return <Wallet className={className} />;
  }
  if (type === "bank") {
    return <Landmark className={className} />;
  }
  if (type === "credit") {
    return <CircleDollarSign className={className} />;
  }

  return <ChartNoAxesCombined className={className} />;
}
