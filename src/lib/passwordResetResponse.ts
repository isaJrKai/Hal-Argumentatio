export interface PasswordResetResponse {
  success: true;
  message: string;
}

/**
 * Keep password-reset responses indistinguishable for known and unknown accounts.
 * Reset credentials must only ever be delivered through the verified email channel.
 */
export function buildPasswordResetResponse(): PasswordResetResponse {
  return {
    success: true,
    message: 'If an account exists with this email address, password reset instructions will be sent.'
  };
}
