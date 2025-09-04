import { SQLDatabase } from "encore.dev/storage/sqldb";

export const mainDB = new SQLDatabase("supabase_crm", {
  migrations: "./migrations",
});
