import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
// import * as dotenv from "dotenv";
import { env } from "@/env";
import { schema } from "./schemas/index";
import { migrate } from "drizzle-orm/postgres-js/migrator";

if (!env.DRIZZLE_DB_URL) {
  throw new Error("DRIZZLE_DB_URL is not set");
}

// https://supabase.com/docs/guides/database/connecting-to-postgres#connecting-with-drizzle
//https://supabase.com/dashboard/project/<project_id>/settings/database
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(env.DRIZZLE_DB_URL, { prepare: false });
export const db = drizzle(client, { schema });

const migrateDb = async () => {
  try {
    // migrating message with a yellow color
    console.log("\x1b[33m%s\x1b[0m", "🟡 Migrating database");
    await migrate(db, { migrationsFolder: "migrations" });
    console.log("\x1b[32m%s\x1b[0m", "🟢 Database migrated successfully");
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "🔴 Error migrating database");
  }
};

/**
 * If you have migrations run on every db interacton your schema stays updated.
 * Have seen this, but performance is not good. Maybe there's a way to batch this
 * or run it on a schedule, but as is, too slow.
 */
// await migrateDb();

export default db;
