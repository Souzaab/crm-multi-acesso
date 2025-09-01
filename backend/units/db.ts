import { SQLDatabase } from "encore.dev/storage/sqldb";

export const unitsDB = new SQLDatabase("crm", {
  migrations: "./migrations",
});
