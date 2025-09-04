import { SQLDatabase } from "encore.dev/storage/sqldb";

export const diagnosticsDB = SQLDatabase.named("supabase_crm");
