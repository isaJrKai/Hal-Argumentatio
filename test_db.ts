import { getPostgresPool } from './src/db/postgres';

async function run() {
  const pool = getPostgresPool();
  if (!pool) return;
  const client = await pool.connect();
  const res = await client.query("SELECT * FROM leads LIMIT 1");
  console.log(Object.keys(res.rows[0] || {}));
  client.release();
  await pool.end();
}
run();
