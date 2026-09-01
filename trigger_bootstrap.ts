import { testPostgresConnection, getPostgresPool } from './src/db/postgres';

async function run() {
  const res = await testPostgresConnection();
  console.log(res);
  const pool = getPostgresPool();
  if (pool) await pool.end();
}
run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
