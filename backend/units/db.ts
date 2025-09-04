import { SQLDatabase } from "encore.dev/storage/sqldb";

export const unitsDB = new SQLDatabase("supabase_crm", {
  migrations: "./migrations",
});
