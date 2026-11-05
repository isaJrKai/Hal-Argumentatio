import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';

const sourceRoot = resolve(process.cwd(), 'src');
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const filePath = join(directory, name);
    const stat = statSync(filePath);
    if (stat.isDirectory()) return sourceFiles(filePath);
    return allowedExtensions.has(extname(filePath)) ? [filePath] : [];
  });
}

function importsLegacyJsonStore(filePath: string, source: string): boolean {
  const importPattern = /(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (specifier === '@/db/db' || (specifier.endsWith('/db/db') || specifier.endsWith('/db/db.ts'))) return true;
    if (!specifier.startsWith('.')) continue;
    const target = resolve(dirname(filePath), specifier);
    if (target === resolve(sourceRoot, 'db', 'db') ||
        target === resolve(sourceRoot, 'db', 'db.ts')) return true;
  }
  return false;
}

describe('runtime persistence boundary', () => {
  it('does not write audit, recommendation outcome, or lesson records through the legacy JSON aggregate', () => {
    const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
    expect(serverSource).not.toMatch(/\bdb\.(addAuditLog|addOutcomeRecord|addLesson)\s*\(/);
  });

  it('does not mirror active harvested leads into the legacy JSON aggregate', () => {
    const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
    const harvestStart = serverSource.indexOf("app.post('/api/leads/ingest'");
    const harvestEnd = serverSource.indexOf('// ─── LEADS ENDPOINTS', harvestStart);
    expect(harvestStart).toBeGreaterThanOrEqual(0);
    expect(harvestEnd).toBeGreaterThan(harvestStart);
    const harvestRoutes = serverSource.slice(harvestStart, harvestEnd);
    expect(harvestRoutes).not.toMatch(/\bdb\.addLead\s*\(/);
    expect(harvestRoutes).not.toMatch(/legacyMirrors/);
  });

  it('keeps legacy lead mutations confined to the production-disabled roadmap simulator', () => {
    const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
    const simulatorStart = serverSource.indexOf("app.post('/api/roadmap/phase1/simulate-transaction'");
    const simulatorEnd = serverSource.indexOf("app.get('/api/roadmap/phase2/status'", simulatorStart);
    expect(simulatorStart).toBeGreaterThanOrEqual(0);
    expect(simulatorEnd).toBeGreaterThan(simulatorStart);
    const simulator = serverSource.slice(simulatorStart, simulatorEnd);
    const productionGuard = simulator.indexOf("if (process.env.NODE_ENV === 'production')");
    const firstLegacyMutation = Math.min(
      ...['db.addLead(', 'db.updateLead('].map(value => simulator.indexOf(value)).filter(index => index >= 0)
    );
    expect(productionGuard).toBeGreaterThanOrEqual(0);
    expect(firstLegacyMutation).toBeGreaterThan(productionGuard);
    const outsideSimulator = serverSource.slice(0, simulatorStart) + serverSource.slice(simulatorEnd);
    expect(outsideSimulator).not.toMatch(/\bdb\.(addLead|updateLead)\s*\(/);
  });

  it('does not import the legacy JSON aggregate store from application source', () => {
    const offenders = sourceFiles(sourceRoot).filter((filePath) =>
      importsLegacyJsonStore(filePath, readFileSync(filePath, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });
});
