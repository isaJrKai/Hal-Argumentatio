export function parseLegacyDatabase(raw: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Legacy database content must be a JSON object.');
  }
  return parsed as Record<string, unknown>;
}
