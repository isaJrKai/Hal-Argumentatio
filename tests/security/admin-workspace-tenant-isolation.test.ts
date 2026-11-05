import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
const start = server.indexOf('function getTargetContractorIds(');
const end = server.indexOf('\n}', start) + 2;
const helper = server.slice(start, end);

describe('Administrator workspace tenant boundary', () => {
  it('keeps ordinary workspace reads tenant-local even for administrators', () => {
    expect(start).toBeGreaterThanOrEqual(0);
    expect(helper).toContain('return [contractorId]');
    expect(helper).not.toContain('con_admin_seed');
    expect(helper).not.toContain('role ===');
  });
});
