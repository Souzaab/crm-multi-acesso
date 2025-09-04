import { SQLDatabase } from "encore.dev/storage/sqldb";

export const metricsDB = SQLDatabase.named("supabase_crm");
