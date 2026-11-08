import { afterEach, describe, expect, it } from 'vitest';
import { getConfiguredDemoAccountId, isDemoReadOnlyMethod } from '../../src/lib/demoAccess';

describe('buyer demo access policy', () => {
  const originalEnabled = process.env.HAL_DEMO_LOGIN_ENABLED;
  const originalAccountId = process.env.HAL_DEMO_ACCOUNT_ID;

  afterEach(() => {
    if (originalEnabled === undefined) delete process.env.HAL_DEMO_LOGIN_ENABLED;
    else process.env.HAL_DEMO_LOGIN_ENABLED = originalEnabled;
    if (originalAccountId === undefined) delete process.env.HAL_DEMO_ACCOUNT_ID;
    else process.env.HAL_DEMO_ACCOUNT_ID = originalAccountId;
  });

  it('stays disabled unless explicitly enabled and bound to an account', () => {
    delete process.env.HAL_DEMO_LOGIN_ENABLED;
    process.env.HAL_DEMO_ACCOUNT_ID = 'buyer-demo';
    expect(getConfiguredDemoAccountId()).toBeNull();

    process.env.HAL_DEMO_LOGIN_ENABLED = 'true';
    delete process.env.HAL_DEMO_ACCOUNT_ID;
    expect(getConfiguredDemoAccountId()).toBeNull();

    process.env.HAL_DEMO_ACCOUNT_ID = ' buyer-demo ';
    expect(getConfiguredDemoAccountId()).toBe('buyer-demo');
  });

  it('allows only safe read methods for the demo account', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      expect(isDemoReadOnlyMethod(method)).toBe(true);
    }
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'TRACE']) {
      expect(isDemoReadOnlyMethod(method)).toBe(false);
    }
  });
});
