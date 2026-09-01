import { db } from './src/db/index.ts';
import { contractors } from './src/db/schema.ts';
import fs from 'fs';

async function sync() {
  const data = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
  const admin = data.contractors.find((c: any) => c.email === 'admin@kaislead.com');
  if (admin) {
    await db.insert(contractors).values({
      id: admin.id,
      email: admin.email,
      passwordHash: admin.passwordHash,
      companyName: admin.name,
      city: 'Winnipeg',
      serviceType: 'Admin',
      activeTerritories: ['Winnipeg'],
      createdAt: new Date(admin.createdAt),
    }).onConflictDoNothing();
    console.log('Admin synced!');
  } else {
    console.log('No admin found in json');
  }
}
sync().catch(console.error).finally(() => process.exit(0));
