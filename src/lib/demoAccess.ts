/**
 * Central buyer-demo configuration and method policy.
 *
 * The public demo session is only available for a separately provisioned,
 * ordinary contractor account selected by deployment configuration.
 */
export function getConfiguredDemoAccountId(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.HAL_DEMO_LOGIN_ENABLED !== 'true') return null;
  const accountId = env.HAL_DEMO_ACCOUNT_ID?.trim();
  return accountId ? accountId : null;
}

export function isDemoReadOnlyMethod(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}
