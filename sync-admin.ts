import { db } from './src/db/index.ts';
import { contractors } from './src/db/schema.ts';
import fs from 'fs';

async function sync() {
  const sourcePath = process.env.HAL_SOURCE_JSON || './data/db.json';
  if (!fs.existsSync(sourcePath)) {
    throw new Error('HAL source JSON not found. Runtime data is excluded from source control; set HAL_SOURCE_JSON to a private export path.');
  }
  const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
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
