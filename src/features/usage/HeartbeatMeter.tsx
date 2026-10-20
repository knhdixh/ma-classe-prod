import type { Locale } from '@/lib/i18n/messages';
import type { getT } from '@/lib/i18n/server';
import type { HeartbeatItem } from './heartbeat';
import { heartbeatAmounts } from './format';

type T = Awaited<ReturnType<typeof getT>>;

const FILL: Record<HeartbeatItem['level'], string> = { ok: 'bg-good', warn: 'bg-warn', over: 'bg-pen' };

/** Last ping per keep-alive source against Supabase's 7-day pause limit. */
export function HeartbeatMeter({ items, t, locale }: { items: HeartbeatItem[] | null; t: T; locale: Locale }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{t('keepalive.title')}</h2>
      {items === null ? (
        <p className="text-muted">{t('keepalive.unavailable')}</p>
      ) : (
        <div className="card flex flex-col gap-5 p-5">
          <p className="text-sm text-muted">{t('keepalive.note')}</p>
          {items.map((item) => {
            const label = t(`keepalive.${item.source}`);
            const amounts = item.sinceMs === null ? t('keepalive.never') : heartbeatAmounts(item.sinceMs, locale);
            const levelText = item.level === 'ok' || item.sinceMs === null ? null : t(item.level === 'over' ? 'keepalive.over' : 'keepalive.warn');
            const pct = Math.min(100, Math.round(item.ratio * 100));
            return (
              <div key={item.source} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="font-medium">{label}</span>
                  <span className="text-sm tabular-nums text-muted">{amounts}</span>
                </div>
                <div
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  aria-valuetext={levelText ? `${amounts}, ${levelText}` : amounts}
                  aria-label={label}
                  className="h-2.5 overflow-hidden rounded-full bg-surface-2"
                >
                  <div className={`h-full rounded-full ${FILL[item.level]}`} style={{ width: `${pct}%` }} />
                </div>
                {levelText && (
                  <p className={`text-sm font-medium ${item.level === 'over' ? 'text-pen' : 'text-ink'}`}>{levelText}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
