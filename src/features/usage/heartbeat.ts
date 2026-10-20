/** Supabase pauses a free project after 7 days without activity (spec §4). */
export const PAUSE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
/** The backup pings every 3 days, so a gap longer than that means a pinger has stopped. */
const WARN_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

/** In the order shown: the daily Vercel cron, then the GitHub Actions backup (migration 0008). */
export const HEARTBEAT_SOURCES = ['vercel-cron', 'github-actions'] as const;
export type HeartbeatSource = (typeof HEARTBEAT_SOURCES)[number];

export type HeartbeatItem = {
  source: HeartbeatSource;
  /** Milliseconds since the last ping, or null when this source has never pinged. */
  sinceMs: number | null;
  ratio: number;
  level: 'ok' | 'warn' | 'over';
};

/** One row per known source, measured against the 7-day pause limit. */
export function heartbeatStatus(rows: readonly { source: string; at: string }[], now: Date): HeartbeatItem[] {
  return HEARTBEAT_SOURCES.map((source) => {
    const at = Date.parse(rows.find((r) => r.source === source)?.at ?? '');
    if (Number.isNaN(at)) return { source, sinceMs: null, ratio: 1, level: 'over' };
    const sinceMs = Math.max(0, now.getTime() - at);
    const level = sinceMs >= PAUSE_AFTER_MS ? 'over' : sinceMs >= WARN_AFTER_MS ? 'warn' : 'ok';
    return { source, sinceMs, ratio: sinceMs / PAUSE_AFTER_MS, level };
  });
}
