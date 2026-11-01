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

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function safeStorageGet(storage: Pick<StorageAdapter, 'getItem'>, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeStorageSet(storage: Pick<StorageAdapter, 'setItem'>, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeStorageRemove(storage: Pick<StorageAdapter, 'removeItem'>, key: string): boolean {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
