import { db } from './src/db/index.ts';
import { leads, leadEvents } from './src/db/schema.ts';
import fs from 'fs';
import { eq } from 'drizzle-orm';

async function sync() {
  const data = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
  for (const l of data.leads) {
    await db.insert(leads).values({
      id: l.id,
      contractorId: l.contractorId,
      businessName: l.businessName,
      city: l.city,
      niche: l.serviceType || l.niche || 'Unknown',
      ownerName: l.ownerName,
      phone: l.phoneEncrypted || l.phone,
      email: l.emailEncrypted || l.email,
      websiteUrl: l.websiteUrl,
      gmbListingUrl: l.gmbListingUrl,
      reviewCount: l.reviewCount,
      reviewScore: l.reviewScore,
      predictedMonthlyLostRevenueUsd: l.predictedMonthlyLostRevenueUsd,
      status: l.status,
      source: l.source,
      assignedContractorId: l.assignedContractorId,
      performanceScore: l.performanceScore,
      sslStatus: l.sslStatus,
      mobileFriendly: l.mobileFriendly,
      urgencyScore: l.urgencyScore,
      predictedLtv: l.predictedLtvUsd,
      notes: l.notes,
      createdAt: new Date(l.createdAt),
      updatedAt: l.updatedAt ? new Date(l.updatedAt) : new Date(l.createdAt)
    }).onConflictDoNothing();
    console.log('Synced lead', l.businessName);
  }

  for (const e of data.leadEvents || []) {
    await db.insert(leadEvents).values({
      id: e.id,
      leadId: e.leadId,
      eventType: e.type || 'SyncedEvent',
      newStage: 'in_progress',
      notes: e.notes,
      createdAt: new Date(e.createdAt),
    }).onConflictDoNothing();
  }
  console.log('Synced lead events');
}
sync().catch(console.error).finally(() => process.exit(0));
