import crypto from 'node:crypto';
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index.ts';
import { contractors } from '../src/db/schema.ts';
import { hashPassword } from '../src/db/db';

async function main() {
  if (process.env.HAL_DEMO_PROVISION_CONFIRM !== 'true') {
    throw new Error('Set HAL_DEMO_PROVISION_CONFIRM=true to confirm you are provisioning the intended database.');
  }
  const id = process.env.HAL_DEMO_ACCOUNT_ID?.trim();
  const email = process.env.HAL_DEMO_EMAIL?.trim().toLowerCase();
  if (!id || !email || !email.includes('@') || !email.split('@')[1]?.includes('.')) {
    throw new Error('Set HAL_DEMO_ACCOUNT_ID and a valid HAL_DEMO_EMAIL before provisioning.');
  }

  const [existingById] = await db.select().from(contractors).where(eq(contractors.id, id)).limit(1);
  const [existingByEmail] = await db.select().from(contractors).where(eq(contractors.email, email)).limit(1);
  if (existingByEmail && existingByEmail.id !== id) {
    throw new Error('HAL_DEMO_EMAIL already belongs to a different account; no changes were made.');
  }
  if (existingById) {
    if (existingById.email !== email || existingById.role === 'admin') {
      throw new Error('The configured demo account already exists but is not eligible; no changes were made.');
    }
    console.log('Buyer demo account already exists. No changes made.');
    return;
  }

  await db.insert(contractors).values({
    id,
    companyName: 'HALBiz Buyer Demo',
    email,
    passwordHash: hashPassword(crypto.randomBytes(48).toString('hex')),
    city: 'Demo workspace',
    serviceType: 'Business development',
    role: 'user',
    accountStatus: 'active'
  });
  console.log('Created the isolated HALBiz buyer-demo account.');
  console.log('Next: add synthetic-only sample records, verify tenant isolation, then enable HAL_DEMO_LOGIN_ENABLED.');
}

main().catch((error) => {
  console.error('[Buyer demo provisioning] Failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
