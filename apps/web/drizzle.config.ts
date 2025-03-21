import { type Config } from "drizzle-kit";
import { defineConfig } from "drizzle-kit";

import { env } from "@/env";

export default defineConfig({
  schema: "./src/server/db/schemas",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  // tablesFilter: ["t3_*"],
  schemaFilter: ["public", "auth", "storage"],
  entities: {
    roles: {
      provider: "supabase",
    },
  },
}) satisfies Config;
