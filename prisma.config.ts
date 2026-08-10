import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer loads .env automatically.
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // .env is optional — CI/hosting may inject the variables directly.
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    // Only used by `npm run db:pull`; `db pull` needs the non-pooled connection.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
