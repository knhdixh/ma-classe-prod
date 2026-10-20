import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { rpc, createClient } = vi.hoisted(() => {
  const rpc = vi.fn();
  return { rpc, createClient: vi.fn<(url: string, key: string, opts: unknown) => { rpc: typeof rpc }>(() => ({ rpc })) };
});
vi.mock('@supabase/supabase-js', () => ({ createClient }));

import { GET } from './route';

const req = (auth?: string) =>
  new Request('http://localhost/api/keepalive', {
    headers: auth ? { authorization: auth } : {},
  }) as unknown as NextRequest;

describe('GET /api/keepalive', () => {
  beforeEach(() => {
    // Only the cron secret and the public Supabase settings: keep-alive must not depend on other secrets.
    vi.stubEnv('LIVEKIT_URL', '');
    vi.stubEnv('LIVEKIT_API_KEY', '');
    vi.stubEnv('LIVEKIT_API_SECRET', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'publishable');
    vi.stubEnv('CRON_SECRET', 'test');
    rpc.mockReset();
    createClient.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('rejects a missing header', async () => {
    expect((await GET(req())).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects a wrong secret', async () => {
    expect((await GET(req('Bearer nope'))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('records a vercel-cron heartbeat with the publishable key', async () => {
    rpc.mockResolvedValue({ data: '2026-10-20T06:00:00+00:00', error: null });
    const res = await GET(req('Bearer test'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, at: '2026-10-20T06:00:00+00:00' });
    expect(createClient.mock.calls[0].slice(0, 2)).toEqual(['https://example.supabase.co', 'publishable']);
    expect(rpc).toHaveBeenCalledWith('heartbeat', { source: 'vercel-cron' });
  });

  it('returns 500 when the heartbeat fails', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    expect((await GET(req('Bearer test'))).status).toBe(500);
  });
});
