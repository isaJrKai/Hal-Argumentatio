export function matchesTerritoryContext(
  recordCity: unknown,
  recordNiche: unknown,
  targetCity: string,
  targetNiche: string
): boolean {
  const cityNeedle = targetCity.trim().toLocaleLowerCase();
  const nicheNeedle = targetNiche.trim().toLocaleLowerCase();
  const cityValue = String(recordCity || '').trim().toLocaleLowerCase();
  const nicheValue = String(recordNiche || '').trim().toLocaleLowerCase();
  return Boolean(cityNeedle && nicheNeedle && cityValue && nicheValue)
    && cityValue.includes(cityNeedle)
    && nicheValue.includes(nicheNeedle);
}

export function filterGoogleAdsTerritoryRecords<T extends {
  geo?: string | null;
  campaignName?: string | null;
  keyword?: string | null;
  searchTerm?: string | null;
}>(
  records: T[],
  targetNiche: string,
  targetCity: string
): T[] {
  const cityNeedle = targetCity.trim().toLocaleLowerCase();
  const nicheNeedle = targetNiche.trim().toLocaleLowerCase();
  if (!cityNeedle || !nicheNeedle) return [];
  return records.filter((record) => {
    const geo = String(record.geo || '').trim().toLocaleLowerCase();
    const tradeText = [record.campaignName, record.keyword, record.searchTerm]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase();
    return matchesTerritoryContext(geo, tradeText, targetCity, targetNiche);
  });
}
