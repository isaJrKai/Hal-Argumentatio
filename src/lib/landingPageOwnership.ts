export interface LandingPageArtifactInput {
  id?: string | null;
  toolId?: string | null;
  status?: string | null;
  contractorId?: string | null;
  content?: unknown;
}

export type LandingPageOwnershipResult =
  | {
      valid: true;
      pageId: string;
      contractorId: string;
      city: string;
      trade: string | null;
    }
  | {
      valid: false;
      reason: 'invalid_artifact' | 'not_published' | 'missing_owner';
    };

/**
 * Resolves the owner and public page context exclusively from the saved
 * artifact. Callers must not pass or trust a contractorId from an anonymous
 * request body.
 */
export function resolvePublishedLandingPageOwner(
  artifact: LandingPageArtifactInput | null | undefined
): LandingPageOwnershipResult {
  if (
    !artifact ||
    typeof artifact.id !== 'string' ||
    !artifact.id.trim() ||
    artifact.toolId !== 'landing_page'
  ) {
    return { valid: false, reason: 'invalid_artifact' };
  }

  if (!['ready', 'deployed'].includes(String(artifact.status || ''))) {
    return { valid: false, reason: 'not_published' };
  }

  if (typeof artifact.contractorId !== 'string' || !artifact.contractorId.trim()) {
    return { valid: false, reason: 'missing_owner' };
  }

  const content = artifact.content && typeof artifact.content === 'object'
    ? artifact.content as Record<string, unknown>
    : {};
  const pageConfig = content.pageConfig && typeof content.pageConfig === 'object'
    ? content.pageConfig as Record<string, unknown>
    : {};

  const city = typeof pageConfig.city === 'string' && pageConfig.city.trim()
    ? pageConfig.city.trim().slice(0, 120)
    : 'Unspecified';
  const trade = typeof pageConfig.trade === 'string' && pageConfig.trade.trim()
    ? pageConfig.trade.trim().slice(0, 80)
    : null;

  return {
    valid: true,
    pageId: artifact.id.trim(),
    contractorId: artifact.contractorId.trim(),
    city,
    trade
  };
}
