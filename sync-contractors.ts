import { db } from './src/db/index.ts';
import { contractors } from './src/db/schema.ts';
import fs from 'fs';

async function sync() {
  const data = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
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
