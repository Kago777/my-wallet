import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getBillingCycle, isBillingDayToday } from "@/lib/credit-card";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const settings = await prisma.creditCardSetting.findMany({
    include: {
      wallet: { select: { userId: true } },
    },
  });

  const results: { walletId: string; amount: number; transferId: string }[] = [];
  const skipped: { walletId: string; reason: string }[] = [];

  for (const setting of settings) {
    if (!isBillingDayToday(today, setting.billingDay)) {
      continue;
    }

    const { cycleStart, cycleEnd, billingMonthLabel } = getBillingCycle(
      today,
      setting.closingDay,
      setting.billingMonthOffset
    );

    const description = `${billingMonthLabel}分クレジット引き落とし`;

    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    const existingTransfer = await prisma.transfer.findFirst({
      where: {
        fromWalletId: setting.settlementWalletId,
        toWalletId: setting.walletId,
        date: { gte: dayStart, lte: dayEnd },
        description,
      },
    });

    if (existingTransfer) {
      skipped.push({ walletId: setting.walletId, reason: "already_settled" });
      continue;
    }

    const total = await prisma.transaction.aggregate({
      where: {
        walletId: setting.walletId,
        date: { gte: cycleStart, lte: cycleEnd },
        type: "expense",
      },
      _sum: { amount: true },
    });

    const amount = total._sum.amount ?? 0;
    if (amount === 0) {
      skipped.push({ walletId: setting.walletId, reason: "zero_amount" });
      continue;
    }

    const transfer = await prisma.transfer.create({
      data: {
        fromWalletId: setting.settlementWalletId,
        toWalletId: setting.walletId,
        amount,
        description,
        userId: setting.wallet.userId,
        date: today,
      },
    });

    results.push({ walletId: setting.walletId, amount, transferId: transfer.id });
  }

  return NextResponse.json({
    settled: results.length,
    skipped: skipped.length,
    results,
    skippedDetails: skipped,
  });
}
