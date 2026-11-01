import type { Contractor } from '../types';

/**
 * Parse the cached, non-authoritative contractor profile without allowing
 * malformed browser storage to crash application startup.
 */
export function parseCachedContractor(raw: string | null): Contractor | null {
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

    const candidate = value as Record<string, unknown>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.email !== 'string' ||
      typeof candidate.name !== 'string' ||
      (candidate.role !== 'admin' && candidate.role !== 'user')
    ) {
      return null;
    }

    return {
      id: candidate.id,
      email: candidate.email,
      name: candidate.name,
      role: candidate.role,
      ...(typeof candidate.marketId === 'string' ? { marketId: candidate.marketId } : {})
    };
  } catch {
    return null;
  }
}
