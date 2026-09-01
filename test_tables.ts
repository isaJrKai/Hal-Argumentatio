import { getPostgresPool } from './src/db/postgres';

async function run() {
  const pool = getPostgresPool();
  if (!pool) return;
  const client = await pool.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log(res.rows.map(r => r.table_name));
  client.release();
  await pool.end();
}
run();
