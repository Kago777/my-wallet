import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDay = today.getDate();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  const subscriptions = await prisma.subscription.findMany({
    where: { isActive: true },
  });

  const targetSubs = subscriptions.filter((sub) => {
    if (sub.billingDate === todayDay) return true;
    if (sub.billingDate > lastDayOfMonth && todayDay === lastDayOfMonth) return true;
    return false;
  });

  const results = [];
  const skipped = [];

  for (const sub of targetSubs) {
    const existing = await prisma.transaction.findFirst({
      where: {
        subscriptionId: sub.id,
        date: { gte: monthStart, lte: monthEnd },
      },
    });

    if (existing) {
      skipped.push(sub.id);
      continue;
    }

    const billingDay = Math.min(sub.billingDate, lastDayOfMonth);
    const transactionDate = new Date(year, month, billingDay);

    const tx = await prisma.transaction.create({
      data: {
        amount: sub.amount,
        type: "expense",
        description: `${sub.name}（自動生成）`,
        date: transactionDate,
        walletId: sub.walletId,
        categoryId: sub.categoryId,
        subscriptionId: sub.id,
      },
    });

    results.push(tx);
  }

  return NextResponse.json({
    generated: results.length,
    skipped: skipped.length,
    transactions: results,
  });
}