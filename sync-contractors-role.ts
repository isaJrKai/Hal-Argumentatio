import { db } from './src/db/index.ts';
import { contractors } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function sync() {
  const data = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
  for (const c of data.contractors) {
    await db.update(contractors).set({ role: c.role || 'user' }).where(eq(contractors.email, c.email));
    console.log('Updated role for', c.email, 'to', c.role || 'user');
  }
}
sync().catch(console.error).finally(() => process.exit(0));
