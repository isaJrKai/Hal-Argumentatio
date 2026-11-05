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
    expect(serverSource).not.toMatch(/\\bdb\\.(addAuditLog|addOutcomeRecord|addLesson)\\s*\\(/);
  });

  it('does not mirror active harvested leads into the legacy JSON aggregate', () => {
    const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
    expect(serverSource).not.toMatch(/\\bdb\\.addLead\\s*\\(/);
    expect(serverSource).not.toMatch(/legacyMirrors/);
  });

  it('does not import the legacy JSON aggregate store from application source', () => {
    const offenders = sourceFiles(sourceRoot).filter((filePath) =>
      importsLegacyJsonStore(filePath, readFileSync(filePath, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });
});
