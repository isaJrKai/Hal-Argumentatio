import { describe, expect, it } from 'vitest';
import { readApiResponse } from '../../src/lib/apiResponse';

describe('readApiResponse', () => {
  it('returns parsed JSON for successful API responses', async () => {
    const response = new Response(JSON.stringify({ tasks: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

    await expect(readApiResponse(response, 'Work queue')).resolves.toEqual({ tasks: [] });
  });

  it('reports HTML responses with status and a safe response preview', async () => {
    const response = new Response('<!doctype html><title>Application error</title>', {
      status: 502,
      headers: { 'content-type': 'text/html' }
    });

    await expect(readApiResponse(response, 'Work queue')).rejects.toThrow(
      'Work queue: expected JSON but received text/html (HTTP 502).'
    );
  });

  it('rejects empty successful responses when JSON is expected', async () => {
    const response = new Response(null, { status: 204 });

    await expect(readApiResponse(response, 'Client projects')).rejects.toThrow(
      'Client projects: server returned an empty response (HTTP 204).'
    );
  });

  it('surfaces JSON API error messages for non-success responses', async () => {
    const response = new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { 'content-type': 'application/json' }
    });

    await expect(readApiResponse(response, 'Leads')).rejects.toThrow(
      'Leads: Session expired (HTTP 401).'
    );
  });

  it('identifies starting server gateway responses with isStartingServer flag', async () => {
    const response = new Response('<!doctype html><title>Starting Server</title><body>Starting</body>', {
      status: 200,
      headers: { 'content-type': 'text/html' }
    });

    try {
      await readApiResponse(response, 'Leads');
      expect.fail('should have thrown');
    } catch (err: any) {
      expect(err.isStartingServer).toBe(true);
      expect(err.message).toContain('Server is starting up');
    }
  });
});
