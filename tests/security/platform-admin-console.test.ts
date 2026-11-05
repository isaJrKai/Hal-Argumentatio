import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
const schema = readFileSync(resolve(process.cwd(), 'src/db/schema.ts'), 'utf8');
const bootstrap = readFileSync(resolve(process.cwd(), 'src/db/postgres.ts'), 'utf8');
const helperStart = server.indexOf('function getTargetContractorIds(');
const helperEnd = server.indexOf('\n}', helperStart) + 2;
const helper = server.slice(helperStart, helperEnd);

describe('Platform administrator tenant and account controls', () => {
  it('keeps ordinary workspace queries tenant-local for administrators', () => {
    expect(helperStart).toBeGreaterThanOrEqual(0);
    expect(helper).toContain('return [contractorId]');
    expect(helper).not.toContain('con_admin_seed');
    expect(helper).not.toContain('role ===');
  });

  it('protects platform account APIs with authentication and persisted admin authorization', () => {
    expect(server).toContain("app.get('/api/admin/overview', authenticate, requireRole('admin')");
    expect(server).toContain("app.get('/api/admin/contractors', authenticate, requireRole('admin')");
    expect(server).toContain("app.patch('/api/admin/contractors/:id', authenticate, requireRole('admin')");
  });

  it('persists account status with an additive database migration', () => {
    expect(schema).toContain("accountStatus: text('account_status').default('active').notNull()");
    expect(bootstrap).toContain('ALTER TABLE contractors ADD COLUMN IF NOT EXISTS account_status');
  });

  it('blocks suspended accounts and audits administrative changes', () => {
    expect(server).toContain("contractor.accountStatus === 'suspended'");
    expect(server).toContain("action: 'ADMIN_CONTRACTOR_ACCESS_CHANGED'");
    expect(server).toContain('At least one active administrator must remain.');
    expect(server).toContain('You cannot remove your own administrator access');
  });

  it('shows the console only to a persisted administrator session', () => {
    const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');
    expect(app).toContain("if (contractor?.role === 'admin')");
    expect(app).toContain("activeTab === 'admin' && contractor?.role === 'admin'");
  });
});
