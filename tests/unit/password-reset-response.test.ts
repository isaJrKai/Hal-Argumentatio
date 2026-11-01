import { describe, expect, it } from 'vitest';
import { buildPasswordResetResponse } from '../../src/lib/passwordResetResponse';

describe('password reset response', () => {
  it('returns one generic response without disclosing reset credentials or account state', () => {
    const knownAccountResponse = buildPasswordResetResponse();
    const unknownAccountResponse = buildPasswordResetResponse();

    expect(knownAccountResponse).toEqual(unknownAccountResponse);
    expect(knownAccountResponse).toEqual({
      success: true,
      message: 'If an account exists with this email address, reset instructions will be sent when email delivery is available.'
    });
    expect(JSON.stringify(knownAccountResponse)).not.toMatch(/resetUrl|debugToken|rawToken|emailDispatched|emailProviderConfigured/i);
  });
});
