import "dotenv/config";
import { PrismaClient, CategoryType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

const defaultCategories: { name: string; type: CategoryType }[] = [
  { name: "食費", type: "expense" },
  { name: "交通費", type: "expense" },
  { name: "娯楽", type: "expense" },
  { name: "日用品", type: "expense" },
  { name: "医療", type: "expense" },
  { name: "給料", type: "income" },
  { name: "副業", type: "income" },
];

async function main() {
  const existing = await prisma.category.count({ where: { isDefault: true } });
  if (existing === 0) {
    for (const category of defaultCategories) {
      await prisma.category.create({
        data: { ...category, isDefault: true },
      });
    }
  }
}

main()
  .catch((error) => {
    process.stderr.write(`${error}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
