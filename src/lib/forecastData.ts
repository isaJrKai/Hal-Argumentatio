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
    return Boolean(geo && tradeText)
      && geo.includes(cityNeedle)
      && tradeText.includes(nicheNeedle);
  });
}
