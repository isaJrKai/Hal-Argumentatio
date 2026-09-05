import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { bootstrapPostgresTables } from './postgres.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
// Returns null when no database is configured (rather than silently
// connecting to a localhost default that can never succeed).
export const createPool = (): Pool | null => {
  if (global._postgresPool) {
    return global._postgresPool;
  }

  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  const hasSqlHost = !!process.env.SQL_HOST;
  if (!connectionString && !hasSqlHost) {
    console.warn(
      '[HAL PostgreSQL] No DATABASE_URL / NEON_DATABASE_URL configured. ' +
        'Running with the local in-memory sandbox store until a database is connected.'
    );
    return null;
  }

  if (connectionString) {
    global._postgresPool = new Pool({
      connectionString,
      ssl: connectionString.includes('neon.tech') || connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 15000,
    });
  } else {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER || 'postgres',
      password: process.env.SQL_PASSWORD || '',
      database: process.env.SQL_DB_NAME || 'postgres',
      port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : undefined,
      max: 10,
      connectionTimeoutMillis: 15000,
    });
  }

  // Prevent unhandled pool-level errors from crashing the application
  global._postgresPool.on('error', (err) => {
    console.error('Unexpected error on idle SQL pool client:', err);
  });

  // Automatically bootstrap tables on pool creation
  bootstrapPostgresTables(global._postgresPool).catch((err) => {
    console.warn('[HAL PostgreSQL] Auto-bootstrap warning on pool creation:', err.message);
  });

  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema. When no pool is available we
// export a lazy proxy so route handlers that call pgDb.* get a clear,
// catchable error instead of a crash at import time.
export const db = pool
  ? drizzle(pool, { schema })
  : (new Proxy(
      {},
      {
        get(_target, prop) {
          // Any query-builder access throws a catchable "no database" error.
          throw new Error(
            `PostgreSQL is not configured (pgDb.${String(prop)}). ` +
              'Set DATABASE_URL or connect a database from Settings.'
          );
        },
      }
    ) as ReturnType<typeof drizzle>);
