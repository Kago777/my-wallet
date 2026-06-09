import "server-only";

import { prisma } from "@/lib/db";

export async function assertWalletOwnership(walletId: string, userId: string) {
  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, userId },
  });
  if (!wallet) {
    throw new Error("Wallet not found or access denied");
  }
  return wallet;
}

export async function assertTransactionOwnership(transactionId: string, userId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, wallet: { userId } },
  });
  if (!transaction) {
    throw new Error("Transaction not found or access denied");
  }
  return transaction;
}

export async function assertBudgetOwnership(budgetId: string, userId: string) {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, wallet: { userId } },
  });
  if (!budget) {
    throw new Error("Budget not found or access denied");
  }
  return budget;
}

export async function assertSubscriptionOwnership(subscriptionId: string, userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, wallet: { userId } },
  });
  if (!subscription) {
    throw new Error("Subscription not found or access denied");
  }
  return subscription;
}

export async function assertRecurringIncomeOwnership(recurringIncomeId: string, userId: string) {
  const recurringIncome = await prisma.recurringIncome.findFirst({
    where: { id: recurringIncomeId, wallet: { userId } },
  });
  if (!recurringIncome) {
    throw new Error("Recurring income not found or access denied");
  }
  return recurringIncome;
}
