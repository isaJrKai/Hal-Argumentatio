import { db } from './src/db/index.ts';
import { revenueRecords } from './src/db/schema.ts';
import fs from 'fs';

async function sync() {
  const sourcePath = process.env.HAL_SOURCE_JSON || './data/db.json';
  if (!fs.existsSync(sourcePath)) {
    throw new Error('HAL source JSON not found. Runtime data is excluded from source control; set HAL_SOURCE_JSON to a private export path.');
  }
  const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  for (const r of data.revenues || []) {
    await db.insert(revenueRecords).values({
      id: r.id,
      contractorId: r.contractorId,
      leadId: r.leadId,
      amountUsd: r.amountUsd,
      source: r.source || 'manual_entry',
      createdAt: new Date(r.recordedAt || r.createdAt || Date.now()),
    }).onConflictDoNothing();
  }
  console.log('Synced revenues');
}
sync().catch(console.error).finally(() => process.exit(0));
