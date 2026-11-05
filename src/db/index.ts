import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { resolveValidSqlHost } from './postgres.ts';
import { normalizePostgresConnectionString } from './connectionString';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    const validHost = resolveValidSqlHost();
    if (validHost) {
      global._postgresPool = new Pool({
        host: validHost,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 5000,
      });
    } else {
      const rawConnectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
      const connectionString = rawConnectionString ? normalizePostgresConnectionString(rawConnectionString) : undefined;
      if (connectionString) {
        global._postgresPool = new Pool({
          connectionString,
          ssl: connectionString.includes('neon.tech') || connectionString.includes('supabase') || connectionString.includes('sslmode=verify-full') ? { rejectUnauthorized: true } : undefined,
          max: 10,
          connectionTimeoutMillis: 5000,
        });
      } else {
        if (process.env.NODE_ENV === 'production') {
          throw new Error(
            'Database configuration is missing. Set DATABASE_URL, NEON_DATABASE_URL, or SQL_HOST/SQL_USER/SQL_PASSWORD/SQL_DB_NAME before starting HAL in production.'
          );
        }
        // Local development/test fallback only. Production must never silently
        // connect to an empty localhost database and appear to have lost data.
        global._postgresPool = new Pool({
          host: '127.0.0.1',
          user: 'postgres',
          password: '',
          database: 'postgres',
          max: 10,
          connectionTimeoutMillis: 2000,
        });
      }
    }

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      if (!err.message?.includes('Connection terminated') && !err.message?.includes('connect ENOENT')) {
        console.warn('PostgreSQL pool connection note:', err.message);
      }
    });

    // Schema initialization is awaited by server startup against this exact pool.
    // Do not start a fire-and-forget bootstrap here: application queries could race it.
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
