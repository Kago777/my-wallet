import { CycleType, WalletType } from "@/generated/prisma/client";

export function walletTypeLabel(type: WalletType): string {
  if (type === "cash") return "現金";
  if (type === "bank") return "銀行";
  return "クレジット";
}

export function cycleTypeLabel(type: CycleType): string {
  if (type === "monthly") return "毎月";
  if (type === "weekly") return "毎週";
  return "毎年";
}
