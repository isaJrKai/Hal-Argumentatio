import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/SystemHealthPanel.tsx', 'utf8');

describe('System health telemetry labels', () => {
  it('identifies the production database as PostgreSQL rather than SQLite', () => {
    expect(source).toContain('PostgreSQL (Neon)');
    expect(source).not.toContain('SQLite Node');
  });
  it('reports the actual AES-256-GCM diagnostic result instead of claiming AES-256-CTR', () => {
    expect(source).toContain('{cryptoLabel}');
    expect(source).not.toContain('AES-256-CTR');
  });
  it('does not call a periodic audit snapshot a live feed', () => {
    expect(source).toContain('Audit Trail Snapshot');
    expect(source).toContain('Latest Records');
    expect(source).not.toContain('Live Feed');
  });
});
