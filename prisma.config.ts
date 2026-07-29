import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });
config({ path: ".env" });

// Prefer DIRECT_URL for CLI/migrations when using a pooler for DATABASE_URL (e.g. Supabase).
const url =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://127.0.0.1:5432/_prisma_generate_only";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url,
  },
});
