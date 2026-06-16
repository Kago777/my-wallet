import "dotenv/config";
import { PrismaClient, CategoryType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  // 支出・1階層目
  { name: "食費",             type: "expense", parent: null },
  { name: "生活費",           type: "expense", parent: null },
  { name: "ファッション・美容", type: "expense", parent: null },
  { name: "教育",             type: "expense", parent: null },
  { name: "娯楽",             type: "expense", parent: null },
  { name: "交通費",           type: "expense", parent: null },
  { name: "医療",             type: "expense", parent: null },
  { name: "冠婚葬祭・交際費", type: "expense", parent: null },
  { name: "その他",           type: "expense", parent: null },

  // 食費の子
  { name: "食料品",   type: "expense", parent: "食費" },
  { name: "外食",     type: "expense", parent: "食費" },
  { name: "カフェ",   type: "expense", parent: "食費" },

  // 生活費の子
  { name: "光熱費",   type: "expense", parent: "生活費" },
  { name: "通信費",   type: "expense", parent: "生活費" },
  { name: "家賃",     type: "expense", parent: "生活費" },

  // 光熱費の子（3階層目）
  { name: "電気料金", type: "expense", parent: "光熱費" },
  { name: "ガス料金", type: "expense", parent: "光熱費" },
  { name: "水道料金", type: "expense", parent: "光熱費" },

  // 通信費の子
  { name: "回線",     type: "expense", parent: "通信費" },
  { name: "スマホ",   type: "expense", parent: "通信費" },

  // ファッション・美容の子
  { name: "衣服・アクセサリー", type: "expense", parent: "ファッション・美容" },
  { name: "美容院",             type: "expense", parent: "ファッション・美容" },
  { name: "化粧品",             type: "expense", parent: "ファッション・美容" },
  { name: "ジム・フィットネス", type: "expense", parent: "ファッション・美容" },

  // 教育の子
  { name: "学費",     type: "expense", parent: "教育" },
  { name: "習い事",   type: "expense", parent: "教育" },

  // 娯楽の子
  { name: "サブスク", type: "expense", parent: "娯楽" },

  // 収入・1階層目
  { name: "労働収入", type: "income", parent: null },
  { name: "資産収入", type: "income", parent: null },
  { name: "その他",   type: "income", parent: null },

  // 労働収入の子
  { name: "給料",     type: "income", parent: "労働収入" },
  { name: "アルバイト", type: "income", parent: "労働収入" },
  { name: "副業",     type: "income", parent: "労働収入" },

  // 資産収入の子
  { name: "利息",     type: "income", parent: "資産収入" },
  { name: "配当",     type: "income", parent: "資産収入" },
] as const;

async function main() {
  // 1パス目：親カテゴリを作成
  const createdMap = new Map<string, string>(); // name → id

  for (const category of defaultCategories.filter(c => !c.parent)) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, type: category.type, isDefault: true, parentId: null },
    });

    if (!existing) {
      const created = await prisma.category.create({
        data: { name: category.name, type: category.type, isDefault: true },
      });
      createdMap.set(category.name, created.id);
    } else {
      createdMap.set(category.name, existing.id);
    }
  }

  // 2パス目：子カテゴリを作成
  for (const category of defaultCategories.filter(c => c.parent)) {
    const parentId = createdMap.get(category.parent!);
    if (!parentId) continue;

    const existing = await prisma.category.findFirst({
      where: { name: category.name, type: category.type, isDefault: true, parentId },
    });

    if (!existing) {
      const created = await prisma.category.create({
        data: { name: category.name, type: category.type, isDefault: true, parentId },
      });
      createdMap.set(category.name, created.id);
    } else {
      createdMap.set(category.name, existing.id);
    }
  }
}

main()
  .catch((error) => {
    process.stderr.write(`${error}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
