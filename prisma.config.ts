import "dotenv/config";
import { defineConfig } from "prisma/config";

// prisma generate does not connect to the DB; a placeholder is fine at build time.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx ./prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
