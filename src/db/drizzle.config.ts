import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;

// Default values to prevent Drizzle Kit from crashing during local `npm run lint` or builds 
// when the env vars might not be present (it only needs them during `drizzle-kit push`).
const isPushCommand = process.argv.some(arg => arg.includes('drizzle-kit'));
if (isPushCommand) {
  if (!sqlHost) throw new Error("SQL_HOST must be set in environment variables.");
  if (!sqlDbName) throw new Error("SQL_DB_NAME must be set in environment variables.");
  if (!user) throw new Error("SQL_ADMIN_USER must be set in environment variables.");
  if (!password) throw new Error("SQL_ADMIN_PASSWORD must be set in environment variables.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: sqlHost || '127.0.0.1',
    user: user || 'admin',
    password: password || 'pass',
    database: sqlDbName || 'db',
    ssl: false,
  },
  verbose: true,
});
