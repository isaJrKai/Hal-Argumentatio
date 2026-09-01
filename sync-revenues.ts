import { db } from './src/db/index.ts';
import { revenueRecords } from './src/db/schema.ts';
import fs from 'fs';

async function sync() {
  const data = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
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
