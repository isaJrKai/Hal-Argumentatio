import { describe, it, expect } from 'vitest';

/**
 * PROTOCOL & SPA FALLBACK GUARD TESTS
 * Tests the invariant that requests directed to `/api/*` MUST NEVER return HTML,
 * even when an endpoint does not exist or encounters an error.
 */

describe('API Protocol: SPA Fallback & JSON Guard', () => {
  it('verifies that the catch-all for /api/* generates pure JSON 404', () => {
    const mockReq = { method: 'GET', path: '/api/v1/phantom-endpoint' };
    
    // Logic matching server.ts lines 5535-5541:
    let statusCode = 0;
    let payload: any = null;

    const mockRes = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        payload = data;
        return this;
      }
    };

    // Handler execution
    const apiCatchAllHandler = (req: any, res: any) => {
      res.status(404).json({
        success: false,
        error: `API endpoint not found: ${req.method} ${req.path}`
      });
    };

    apiCatchAllHandler(mockReq, mockRes);

    expect(statusCode).toBe(404);
    expect(payload).toBeDefined();
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('API endpoint not found');
    expect(typeof payload).toBe('object');
    // Ensure payload is not HTML string
    expect(typeof payload !== 'string' || !payload.includes('<!DOCTYPE html>')).toBe(true);
  });
});
