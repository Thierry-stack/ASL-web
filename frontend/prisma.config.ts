import { config as loadEnv } from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

loadEnv({ path: path.join(process.cwd(), ".env") });
loadEnv({ path: path.join(process.cwd(), ".env.local") });

/**
 * Prisma 7+: URLs live here, not in schema.prisma.
 * Supabase: prefer DIRECT_URL (session pooler :5432) for migrations / CLI.
 * Falls back to DATABASE_URL if DIRECT_URL is unset (e.g. local dev).
 * Runtime app queries use DATABASE_URL (pooler) via @prisma/adapter-pg.
 */
/** CLI/migrations: prefer DIRECT_URL (Supabase session pooler). Fallback for `prisma generate` when env is not loaded (e.g. fresh npm install). */
const cliUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://127.0.0.1:5432/postgres";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: cliUrl,
  },
});
