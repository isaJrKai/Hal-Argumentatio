import { db } from './src/db/index.ts';
import { contractors } from './src/db/schema.ts';
import fs from 'fs';

async function sync() {
  const sourcePath = process.env.HAL_SOURCE_JSON || './data/db.json';
  if (!fs.existsSync(sourcePath)) {
    throw new Error('HAL source JSON not found. Runtime data is excluded from source control; set HAL_SOURCE_JSON to a private export path.');
  }
  const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  for (const c of data.contractors) {
    if (c.email === 'admin@kaislead.com') continue; // already did
    await db.insert(contractors).values({
      id: c.id,
      email: c.email,
      passwordHash: c.passwordHash,
      companyName: c.name,
      city: 'Unknown',
      serviceType: 'Unknown',
      createdAt: new Date(c.createdAt),
    }).onConflictDoNothing();
    console.log('Synced', c.email);
  }
}
sync().catch(console.error).finally(() => process.exit(0));
