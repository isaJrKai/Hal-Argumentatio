/**
 * pg-connection-string currently treats prefer/require/verify-ca as
 * verify-full and warns that a future major release will adopt weaker
 * libpq semantics. Make the intended certificate+hostname verification
 * explicit before the URL reaches node-postgres.
 */
export function normalizePostgresConnectionString(connectionString: string): string {
  return connectionString.replace(/([?&]sslmode=)(?:prefer|require|verify-ca)(?=&|#|$)/gi, '$1verify-full');
}
