import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  const users = await prisma.user.findMany();
  const results = [];

  for (const user of users) {
    const existing = await prisma.reminder.findFirst({
      where: {
        userId: user.id,
        type: "subscription_review",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    });

    if (!existing) {
      await prisma.reminder.create({
        data: {
          type: "subscription_review",
          title: "サブスクの確認",
          description: "今月のサブスクに変更や追加はありますか？",
          userId: user.id,
        },
      });

      const recurringBills = await prisma.recurringBill.findMany({
        where: { wallet: { userId: user.id }, isActive: true },
      });

      for (const bill of recurringBills) {
        await prisma.reminder.create({
          data: {
            type: "bill_input",
            title: `${bill.name}の金額を入力してください`,
            description: `推定額: ¥${bill.estimatedAmount.toLocaleString()}`,
            userId: user.id,
            recurringBillId: bill.id,
          },
        });
      }

      results.push(user.id);
    }
  }

  return NextResponse.json({
    generated: results.length,
    users: results,
  });
}