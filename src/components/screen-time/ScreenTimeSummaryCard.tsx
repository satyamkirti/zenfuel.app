'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { ChevronRight, Smartphone, RefreshCw } from 'lucide-react';
import { useScreenTime } from '@/hooks/useScreenTime';
import { formatDuration, statusLabel } from '@/lib/usage/status';
import { IconTile } from '@/components/ui/Card';
import { PhoneTimeArt } from '@/components/ui/Illustrations';
import { useAppLabel, AppAvatar, formatAgo, BAR, DOT, formatLimit } from './parts';
import { useT } from '@/i18n/I18nProvider';

type ScreenTime = ReturnType<typeof useScreenTime>;

const linkClass = 'inline-flex items-center gap-0.5 min-h-[40px] rounded-xl px-2.5 text-sm font-semibold text-brand-text hover:bg-brand-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

// Home preview: today's measured total and the top apps with their limits, or a way to set it up.
// In a browser it says plainly that measuring needs the Android app; nothing is ever estimated.
export function ScreenTimeSummaryCard({ st }: { st: ScreenTime }) {
  const label = useAppLabel();
  const t = useT();

  // Not measuring yet (website, or tracking off): one clear card that leads to the Screen Time page.
  if (st.phase === 'unsupported' || (st.phase === 'ready' && !st.settings.trackingEnabled)) {
    const web = st.phase === 'unsupported';
    return (
      <section aria-labelledby="st-preview-title" className="card relative overflow-hidden p-4 pr-5 flex items-center gap-3.5">
        <span className="pointer-events-none absolute -left-10 -top-12 w-40 h-40 rounded-full glow-teal" aria-hidden="true" />
        <PhoneTimeArt className="relative w-[72px] h-[72px] shrink-0" />
        <div className="relative min-w-0 flex-1">
          <h2 id="st-preview-title" className="font-display text-[16px] font-semibold text-ink">{web ? t('st.cardTitleWeb') : t('st.cardTitle')}</h2>
          <p className="text-[13px] text-muted mt-0.5 leading-snug">
            {web ? t('st.cardBodyWeb') : t('st.cardBody')}
          </p>
          <Link href="/screen-time" className="mt-2.5 inline-flex items-center gap-1 min-h-[36px] px-3.5 rounded-xl btn-primary text-[13px]">
            {web ? t('common.learnMore') : t('st.setUp')} <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }
  if (st.phase !== 'ready') return null;

  const { summary, status, now } = st;
  const measuring = summary.measuring;
  const top = summary.apps.filter(a => (a.usedMs ?? 0) > 0).slice(0, 3);
  const line = !status
    ? t('st.checking')
    : !measuring
      ? t('st.notNow')
      : status.lastSyncAt ? t('st.updated', { when: formatAgo(status.lastSyncAt, now) }) : t('st.notUpdated');

  return (
    <section aria-labelledby="st-preview-title" className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <IconTile tone="blue" size="lg"><Smartphone size={20} /></IconTile>
          <div className="min-w-0">
            <h2 id="st-preview-title" className="text-sm font-medium text-muted">{t('st.today')}</h2>
            <p className={clsx('num mt-0.5 text-[30px] leading-none font-bold', measuring ? 'text-ink' : 'text-muted')}>
              {summary.totalTodayMs === null ? '—' : formatDuration(summary.totalTodayMs)}
            </p>
          </div>
        </div>
        <Link href="/screen-time" className={clsx(linkClass, 'shrink-0 -mr-2')}>{t('st.details')} <ChevronRight size={16} aria-hidden="true" /></Link>
      </div>
      <p className={clsx('mt-3 flex items-center gap-1.5 text-xs font-medium', measuring ? 'text-muted' : 'text-warn')}>
        <RefreshCw size={12} aria-hidden="true" /> {line}
      </p>

      {top.length > 0 && (
        <ul className="mt-4 space-y-3.5">
          {top.map(a => {
            const pct = a.status.ratio === null ? null : Math.min(100, Math.round(a.status.ratio * 100));
            return (
              <li key={a.app.id} className="flex items-center gap-3">
                <AppAvatar app={a.app} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink">{label(a.app)}</span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">{formatDuration(a.usedMs ?? 0)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="track h-1.5 flex-1" aria-hidden="true">
                      {pct !== null && <div className={clsx('h-full rounded-full grow-x transition-[width] duration-500', BAR[a.status.level])} style={{ width: `${Math.max(pct, 3)}%` }} />}
                    </div>
                    <span className="shrink-0 flex items-center gap-1 text-[11px] text-muted">
                      <span className={clsx('w-1.5 h-1.5 rounded-full', DOT[a.status.level])} aria-hidden="true" />
                      {a.setting.limitMinutes ? `${statusLabel(a.status)} · ${formatLimit(a.setting.limitMinutes)}` : t('st.noLimit')}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
