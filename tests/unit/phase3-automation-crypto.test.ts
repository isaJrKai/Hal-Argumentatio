import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { signWebhookPayload, verifyWebhookPayloadSignature, verifyPhase3Pillars } from '../../src/lib/phase3-automation';

const source = readFileSync('src/lib/phase3-automation.ts', 'utf8');

describe('Phase 3 browser-safe HMAC', () => {
  it('creates a 64-character HMAC-SHA256 signature and verifies the original payload', async () => {
    const secret = 'test-secret-for-hmac-roundtrip';
    const payload = { event: 'test', value: 42 };
    const signature = await signWebhookPayload(secret, payload);
    expect(signature).toMatch(/^[a-f0-9]{64}$/);
    await expect(verifyWebhookPayloadSignature(secret, payload, signature)).resolves.toBe(true);
  });

  it('rejects a modified payload and malformed signature', async () => {
    const secret = 'test-secret-for-hmac-roundtrip';
    const payload = { event: 'test', value: 42 };
    const signature = await signWebhookPayload(secret, payload);
    await expect(verifyWebhookPayloadSignature(secret, { ...payload, value: 43 }, signature)).resolves.toBe(false);
    await expect(verifyWebhookPayloadSignature(secret, payload, 'invalid')).resolves.toBe(false);
  });

  it('runs the Phase 3 HMAC self-test asynchronously', async () => {
    const report = await verifyPhase3Pillars([], [], []);
    expect(report.pillar2.metrics.hmacSignatureCheck).toBe('PASSED');
  });

  it('does not import Node-only crypto into a browser-shared module', () => {
    expect(source).not.toContain("import crypto from 'crypto'");
    expect(source).toContain('globalThis.crypto.subtle');
  });
});
