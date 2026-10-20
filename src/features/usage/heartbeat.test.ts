import { describe, expect, it } from 'vitest';
import { heartbeatStatus, PAUSE_AFTER_MS } from './heartbeat';

const now = new Date('2026-10-20T12:00:00.000Z');
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();

describe('heartbeatStatus', () => {
  it('lists both sources in order, even when the table is empty', () => {
    const s = heartbeatStatus([], now);
    expect(s.map((i) => i.source)).toEqual(['vercel-cron', 'github-actions']);
    expect(s.every((i) => i.sinceMs === null && i.level === 'over')).toBe(true);
  });
  it('measures time since the last ping against the 7-day limit', () => {
    const [cron] = heartbeatStatus([{ source: 'vercel-cron', at: hoursAgo(6) }], now);
    expect(cron.sinceMs).toBe(6 * 3600_000);
    expect(cron.ratio).toBeCloseTo((6 * 3600_000) / PAUSE_AFTER_MS);
    expect(cron.level).toBe('ok');
  });
  it('warns after 3 days and is over at 7', () => {
    const [cron, gh] = heartbeatStatus(
      [
        { source: 'vercel-cron', at: hoursAgo(80) },
        { source: 'github-actions', at: hoursAgo(7 * 24) },
      ],
      now,
    );
    expect(cron.level).toBe('warn');
    expect(gh.level).toBe('over');
  });
  it('ignores unknown sources and treats a ping from the future as just now', () => {
    const s = heartbeatStatus(
      [
        { source: 'other', at: hoursAgo(1) },
        { source: 'github-actions', at: hoursAgo(-1) },
      ],
      now,
    );
    expect(s[0].sinceMs).toBeNull();
    expect(s[1].sinceMs).toBe(0);
  });
});
