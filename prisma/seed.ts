import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  url: process.env.DATABASE_URL ?? "postgresql://dummy:dummy@localhost:5432/dummy",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // デフォルトカテゴリ
  const categories = [
    { name: "食費", type: "expense", isDefault: true },
    { name: "交通費", type: "expense", isDefault: true },
    { name: "娯楽", type: "expense", isDefault: true },
    { name: "日用品", type: "expense", isDefault: true },
    { name: "医療", type: "expense", isDefault: true },
    { name: "給料", type: "income", isDefault: true },
    { name: "副業", type: "income", isDefault: true },
  ];

  for (const category of categories) {
    await prisma.category.create({ data: category });
  }

  // デフォルトユーザー
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "テストユーザー",
    },
  });

  // デフォルト財布
  await prisma.wallet.create({
    data: {
      id: "default-wallet",
      name: "現金",
      type: "cash",
      balance: 0,
      userId: user.id,
    },
  });

  console.log("シードデータの投入完了");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
