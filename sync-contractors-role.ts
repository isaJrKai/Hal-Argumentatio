import { db } from './src/db/index.ts';
import { contractors } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function sync() {
  const sourcePath = process.env.HAL_SOURCE_JSON || './data/db.json';
  if (!fs.existsSync(sourcePath)) {
    throw new Error('HAL source JSON not found. Runtime data is excluded from source control; set HAL_SOURCE_JSON to a private export path.');
  }
  const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  for (const c of data.contractors) {
    await db.update(contractors).set({ role: c.role || 'user' }).where(eq(contractors.email, c.email));
    console.log('Updated role for', c.email, 'to', c.role || 'user');
  }
}
sync().catch(console.error).finally(() => process.exit(0));
