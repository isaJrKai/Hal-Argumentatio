import { getPostgresPool } from './src/db/postgres';

async function run() {
  const pool = getPostgresPool();
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS google_rating DOUBLE PRECISION DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sentiment_score DOUBLE PRECISION DEFAULT 5.0,
      ADD COLUMN IF NOT EXISTS outreach_strategy TEXT;
    `);
    console.log("Columns added successfully");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
