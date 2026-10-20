import type { Locale } from '@/lib/i18n/messages';
import { FREE_LIMITS, type UsageItem } from './estimate';
import { PAUSE_AFTER_MS } from './heartbeat';

type Unit = 'gigabyte' | 'megabyte' | 'minute' | 'hour' | 'day';

/** A number with its unit in the reader's language: "1,2 Go" in French, "1.2 GB" in English. */
function unit(locale: Locale, u: Unit, value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: u,
    unitDisplay: 'short',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** "used / limit" for one meter. Storage counts binary megabytes against the 1 GB (1024³ bytes) limit. */
export function usageAmounts(item: UsageItem, locale: Locale): string {
  switch (item.key) {
    case 'minutes':
      return `${unit(locale, 'minute', item.used)} / ${unit(locale, 'minute', FREE_LIMITS.participantMinutes)}`;
    case 'data':
      return `${unit(locale, 'gigabyte', item.used / 1e9, 1)} / ${unit(locale, 'gigabyte', FREE_LIMITS.downstreamBytes / 1e9)}`;
    case 'storage':
      return `${unit(locale, 'megabyte', item.used / 1024 ** 2)} / ${unit(locale, 'gigabyte', FREE_LIMITS.storageBytes / 1024 ** 3)}`;
  }
}

/** "time since the last ping / 7 days", in minutes, hours or days so the number stays readable. */
export function heartbeatAmounts(sinceMs: number, locale: Locale): string {
  const minutes = sinceMs / 60000;
  const since =
    minutes < 60
      ? unit(locale, 'minute', Math.floor(minutes))
      : minutes < 48 * 60
        ? unit(locale, 'hour', Math.floor(minutes / 60))
        : unit(locale, 'day', minutes / (24 * 60), 1);
  return `${since} / ${unit(locale, 'day', PAUSE_AFTER_MS / (24 * 60 * 60 * 1000))}`;
}
