'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, BellOff, Trash2, Power, Check, Lock, Smartphone, Gauge, ShieldCheck, Sparkles, BellRing, Settings2, CheckCircle2, AlertTriangle, Circle } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Disclosure } from '@/components/ui/Disclosure';
import { IconTile } from '@/components/ui/Card';
import { usePrivacy } from '@/context/PrivacyContext';
import { useScreenTime } from '@/hooks/useScreenTime';
import { SUPPORTED_APPS, categoryLabel, getSupportedApp, AppCategory, SupportedApp } from '@/lib/usage/catalog';
import { useT } from '@/i18n/I18nProvider';
import { PhoneTimeArt } from '@/components/ui/Illustrations';

// Each app category has its own colour: a dot, a soft ring around it, and its selected-count badge.
const CATEGORY_DOT: Record<AppCategory, string> = {
  social: 'bg-sky-500 ring-sky-500/20',
  video: 'bg-pink-500 ring-pink-500/20',
  messaging: 'bg-emerald-500 ring-emerald-500/20',
};
const CATEGORY_BADGE: Record<AppCategory, string> = {
  social: 'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200',
  video: 'bg-pink-100 text-pink-800 dark:bg-pink-400/15 dark:text-pink-200',
  messaging: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200',
};
import { limitAlertsState } from '@/lib/usage/settings';
import { buildUsageInsights } from '@/lib/usage/records';
import { formatDuration, formatDurationLong, USAGE_STATUS_THRESHOLDS } from '@/lib/usage/status';
import { useAppLabel, AppAvatar, UsageStatusBadge, UsageBar, formatLimit, formatAgo, dayLabel, DOT } from './parts';
import { BRAND_PALETTE } from '@/utils/palette';

type ScreenTime = ReturnType<typeof useScreenTime>;

const LIMIT_PRESETS = [15, 30, 45, 60, 90, 120, 180, 240];
const pct = (r: number) => `${Math.round(r * 100)}%`;

// ── Website ───────────────────────────────────────────────────────────────────

export function ScreenTimeUnsupported() {
  const t = useT();
  return (
    <div className="space-y-5 max-w-3xl">
      <section className="card relative overflow-hidden p-5 sm:p-7">
        <span className="pointer-events-none absolute -right-20 -top-20 w-72 h-72 rounded-full glow-blue" aria-hidden="true" />
        <IconTile tone="blue" size="lg" className="relative"><Smartphone size={21} /></IconTile>
        <h2 className="relative mt-4 font-display text-xl font-bold tracking-tight text-ink">{t('st.webTitle')}</h2>
        <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{t('st.webBody')}</p>
        <p className="mt-3 text-sm text-muted leading-relaxed">{t('st.webNote')}</p>
        <Link href="/" className="mt-5 inline-flex items-center min-h-[46px] px-5 rounded-2xl btn-primary text-sm">{t('st.backHome')}</Link>
      </section>
      <ul className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Gauge, tone: 'blue' as const, title: t('st.featMeasured'), text: t('st.featMeasuredText') },
          { icon: BellRing, tone: 'amber' as const, title: t('st.featLimits'), text: t('st.featLimitsText') },
          { icon: ShieldCheck, tone: 'green' as const, title: t('st.featPhone'), text: t('st.featPhoneText') },
        ].map(({ icon: Icon, tone, title, text }) => (
          <li key={title} className="card p-4">
            <IconTile tone={tone}><Icon size={18} /></IconTile>
            <p className="mt-3 text-[15px] font-semibold text-ink">{title}</p>
            <p className="mt-1 text-sm text-muted leading-relaxed">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── What ZenFuel reads (the full disclosure, one tap away) ────────────────────

function WhatWeRead() {
  const t = useT();
  const items = [
    { title: t('st.readWhatTitle'), text: t('st.readWhat') },
    { title: t('st.readReadsTitle'), text: t('st.readReads') },
    { title: t('st.readWhyTitle'), text: t('st.readWhy') },
    { title: t('st.readWhereTitle'), text: t('st.readWhere') },
    { title: t('st.readOffTitle'), text: t('st.readOff') },
  ];
  return (
    <ul className="space-y-3">
      {items.map(i => (
        <li key={i.title} className="text-sm text-ink-2 leading-relaxed">
          <strong className="text-ink">{i.title}</strong> {i.text}
        </li>
      ))}
    </ul>
  );
}

const CATEGORY_ORDER: AppCategory[] = ['social', 'video', 'messaging'];

function AppTile({ app, on, found, showFound, onToggle }: { app: SupportedApp; on: boolean; found: boolean | undefined; showFound: boolean; onToggle: (id: string, on: boolean) => void }) {
  const label = useAppLabel();
  const t = useT();
  return (
    <label className={clsx(
      'relative flex flex-col gap-3 p-3.5 min-h-[120px] rounded-[20px] border-2 cursor-pointer select-none transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.97]',
      'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg',
      on
        ? 'border-brand bg-gradient-to-br from-brand-soft to-surface shadow-[0_12px_24px_-16px_rgb(var(--brand))] dark:to-surface-2'
        : 'border-line bg-surface-2/70 hover:border-line-strong hover:bg-surface dark:bg-surface'
    )}>
      <span className="flex items-start justify-between gap-2">
        <AppAvatar app={app} size="lg" />
        <span className={clsx('w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-colors duration-200', on ? 'bg-brand-gradient text-on-brand shadow-glow' : 'border-2 border-line-strong bg-surface')} aria-hidden="true">
          {on && <Check size={14} strokeWidth={3} className="pop-in" />}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-ink truncate">{label(app)}</span>
        {on
          ? <span className="mt-1 pill-brand"><Check size={11} strokeWidth={3} aria-hidden="true" />{t('st.selected')}</span>
          : <span className="block mt-0.5 text-xs text-muted">{showFound ? (found ? t('st.onPhone') : t('st.notFound')) : t('st.notSelected')}</span>}
      </span>
      <input type="checkbox" className="sr-only" checked={on} onChange={e => onToggle(app.id, e.target.checked)} aria-label={t('st.trackApp', { app: label(app) })} />
    </label>
  );
}

function AppPicker({ st, selected, onToggle }: { st: ScreenTime; selected: Set<string>; onToggle: (id: string, on: boolean) => void }) {
  const t = useT();
  const [showAll, setShowAll] = useState(false);
  // Ticked when the list opened: kept fixed so ticking an app never makes the list jump.
  const [initiallySelected] = useState(() => new Set(selected));
  // Apps found on this phone, plus any already ticked, come first. The other supported apps are
  // one tap away. If the installed list is unknown or empty, everything is shown.
  const { main, more } = useMemo(() => {
    const inst = st.installed;
    if (!inst || inst.size === 0) return { main: [...SUPPORTED_APPS], more: [] as typeof SUPPORTED_APPS };
    const first = SUPPORTED_APPS.filter(a => inst.has(a.id) || initiallySelected.has(a.id));
    return { main: first, more: SUPPORTED_APPS.filter(a => !first.includes(a)) };
  }, [st.installed, initiallySelected]);
  const apps = showAll ? [...main, ...more] : main;
  const groups = CATEGORY_ORDER.map(c => ({ c, apps: apps.filter(a => a.category === c) })).filter(g => g.apps.length > 0);
  return (
    <div className="space-y-5">
    {groups.map(({ c, apps: list }) => {
      const n = list.filter(a => selected.has(a.id)).length;
      return (
        <section key={c} aria-label={t('st.categoryApps', { category: categoryLabel(c) })}>
          <h3 className="flex items-center gap-2.5 px-1 mb-2.5 text-[12.5px] font-bold uppercase tracking-[0.1em] text-ink-2">
            <span className={clsx('w-2.5 h-2.5 rounded-full ring-4', CATEGORY_DOT[c])} aria-hidden="true" />
            {categoryLabel(c)}
            <span className="text-muted font-semibold tracking-normal normal-case">· {list.length}</span>
            {n > 0 && <span className={clsx('ml-auto pill normal-case tracking-normal', CATEGORY_BADGE[c])}>{t('st.nSelected', { count: n })}</span>}
          </h3>
          <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map(app => (
              <li key={app.id}>
                <AppTile app={app} on={selected.has(app.id)} found={st.installed?.has(app.id)} showFound={st.installed !== null} onToggle={onToggle} />
              </li>
            ))}
          </ul>
        </section>
      );
    })}
    {more.length > 0 && (
      <button
        type="button"
        onClick={() => setShowAll(v => !v)}
        aria-expanded={showAll}
        className="w-full min-h-[56px] px-4 py-2 rounded-2xl border border-dashed border-line-strong text-center hover:bg-surface-2/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {showAll ? (
          <span className="text-sm font-semibold text-brand-text">{t('st.hideMissing')}</span>
        ) : (
          <>
            <span className="block text-sm font-semibold text-brand-text">{t('st.showMore', { count: more.length })}</span>
            <span className="block text-xs text-muted mt-0.5">{t('st.notFoundMore')}</span>
          </>
        )}
      </button>
    )}
    </div>
  );
}

// ── Before tracking is on: choose apps ────────────────────────────────────────

function ChooseApps({ st }: { st: ScreenTime }) {
  // Starts from the apps chosen last time (if tracking was on before). Confirming saves exactly
  // the ticked apps: anything unticked here is no longer measured.
  const t = useT();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(st.settings.apps.map(a => a.appId)));
  const hadSelection = st.settings.apps.length > 0;
  const toggle = (id: string, on: boolean) => setSelected(prev => { const n = new Set(prev); if (on) n.add(id); else n.delete(id); return n; });
  const n = selected.size;
  return (
    <div className="space-y-5">
      <section aria-labelledby="choose-title" className="card surface-mint relative overflow-hidden p-4 sm:p-5 flex items-center gap-4">
        <span className="pointer-events-none absolute -right-16 -top-16 w-52 h-52 rounded-full glow-teal" aria-hidden="true" />
        <span className="relative shrink-0 rounded-[22px] p-1 bg-gradient-to-br from-teal-100 to-sky-100 ring-1 ring-inset ring-teal-200/70 dark:from-teal-400/15 dark:to-blue-500/15 dark:ring-white/10">
          <PhoneTimeArt className="w-[72px] h-[72px]" />
        </span>
        <div className="relative min-w-0">
        <h2 id="choose-title" className="font-display text-xl font-bold tracking-tight text-ink">{t('st.chooseTitle')}</h2>
        <p className="mt-1 text-sm text-muted leading-relaxed">
          {hadSelection ? t('st.choosePrev') : t('st.chooseNew')}
        </p>
        </div>
      </section>

      <p className="flex items-center justify-between gap-3 px-1 text-sm" role="status" aria-live="polite">
        <span className="inline-flex items-center gap-2 font-semibold text-ink">
          <span className={clsx('min-w-[26px] h-[26px] px-1.5 rounded-full inline-flex items-center justify-center text-xs font-bold tabular-nums', n > 0 ? 'bg-brand-gradient text-on-brand' : 'bg-surface-3 text-muted dark:bg-white/[0.07]')} aria-hidden="true">{n}</span>
          {n === 0 ? t('st.noApps') : t('st.appsSelected', { count: n })}
        </span>
        {n > 0 && <button type="button" onClick={() => setSelected(new Set())} className="min-h-[36px] px-2 -mr-2 rounded-lg font-semibold text-brand-text hover:bg-brand-soft">{t('st.clear')}</button>}
      </p>

      <AppPicker st={st} selected={selected} onToggle={toggle} />

      <div className="rounded-card border border-line bg-surface shadow-card px-4 py-3.5">
        <p className="flex gap-2.5 text-sm text-ink-2 leading-relaxed">
          <Lock size={16} className="shrink-0 mt-0.5 text-good" aria-hidden="true" />
          <span>{t('st.privacyNote')}</span>
        </p>
        <Disclosure variant="plain" title={t('st.readTitle')} className="mt-3">
          <WhatWeRead />
          <p className="mt-3 text-sm text-muted">{t('st.defaultLimit')}</p>
        </Disclosure>
      </div>

      {/* In the normal page flow (not sticky), so it never covers the list or the privacy note.
          The page's own bottom padding keeps it clear of the bottom nav and the home indicator. */}
      <Button className="w-full" size="xl" disabled={n === 0} onClick={() => st.enableTracking([...selected])}>
        {n === 0 ? t('st.chooseOne') : t('st.trackN', { count: n })}
      </Button>
    </div>
  );
}

// ── Usage Access missing or revoked ───────────────────────────────────────────

function NeedsAccess({ st }: { st: ScreenTime }) {
  const { appName } = usePrivacy();
  const t = useT();
  const [failed, setFailed] = useState(false);
  const revoked = st.status?.lastSyncAt !== null && st.status?.lastSyncAt !== undefined;
  // Bold names inside the steps: the step text is split around a {placeholder}.
  const bold = (text: string, value: string) => {
    const [before, after] = text.split('\u0000');
    return <>{before}<strong className="text-ink">{value}</strong>{after}</>;
  };
  const steps = [
    bold(t('st.step1', { button: '\u0000' }), t('st.allowAccess')),
    bold(t('st.step2', { app: '\u0000' }), appName),
    bold(t('st.step3', { setting: '\u0000' }), t('st.step3Setting')),
    <>{t('st.step4')}</>,
  ];
  return (
    <section aria-labelledby="access-title" className="rounded-card border border-amber-300/80 bg-amber-50 dark:bg-amber-400/[0.07] dark:border-amber-400/25 p-5 sm:p-6 shadow-card">
      <div className="flex items-center gap-3.5">
        <PhoneTimeArt tone="warn" className="w-16 h-16 shrink-0" />
        <div className="min-w-0">
          <p className="pill-warn mb-1"><AlertTriangle size={11} aria-hidden="true" />{revoked ? t('st.accessOff') : t('st.permissionNeeded')}</p>
          <h2 id="access-title" className="font-display text-lg font-bold leading-snug text-ink">{t('st.notMeasuredTitle')}</h2>
        </div>
      </div>
      <p className="mt-1.5 text-[15px] text-ink-2 leading-relaxed">
        {revoked ? t('st.revokedBody') : t('st.needBody')}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="lg" onClick={async () => setFailed(!(await st.openUsageAccessSettings()))}>{t('st.allowAccess')}</Button>
        <Button size="lg" variant="outline" loading={st.refreshing} onClick={st.refresh}>{t('st.checkAgain')}</Button>
      </div>
      {failed && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          {t('st.settingsFailed')}
        </p>
      )}
      <div className="mt-4 pt-4 border-t border-amber-300/60 dark:border-amber-400/20">
        <p className="text-sm font-semibold text-ink mb-2.5">{t('st.howToAllow')}</p>
        <ol className="space-y-2.5">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink-2 leading-relaxed">
              <span className="w-6 h-6 shrink-0 rounded-full bg-amber-500/20 text-warn text-xs font-bold flex items-center justify-center" aria-hidden="true">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── Today ─────────────────────────────────────────────────────────────────────

function TodaySummary({ st }: { st: ScreenTime }) {
  const { summary, status, freshness: fresh, now } = st;
  const t = useT();
  const tracking = status?.usageAccess === 'granted';
  const state = tracking
    ? fresh === 'stale'
      ? { dot: 'bg-warn', text: t('st.trackingStale') }
      : { dot: 'bg-good relative ping-once', text: t('st.trackingOn') }
    : { dot: 'bg-line-strong', text: t('st.notMeasuring') };
  const when = status?.lastSyncAt ? t(tracking ? 'st.updatedAgo' : 'st.lastMeasured', { when: formatAgo(status.lastSyncAt, now) }) : t('st.notUpdated');
  const label = useAppLabel();
  // Refresh feedback: a tick and "Updated" for a moment after a refresh succeeds.
  const [justUpdated, setJustUpdated] = useState(false);
  const wasRefreshing = useRef(false);
  useEffect(() => {
    if (wasRefreshing.current && !st.refreshing) {
      wasRefreshing.current = false;
      if (!st.error) {
        setJustUpdated(true);
        const timer = setTimeout(() => setJustUpdated(false), 2400);
        return () => clearTimeout(timer);
      }
    }
    if (st.refreshing) wasRefreshing.current = true;
  }, [st.refreshing, st.error]);
  const measured = summary.apps.filter(a => (a.usedMs ?? 0) > 0).sort((a, b) => (b.usedMs ?? 0) - (a.usedMs ?? 0));
  const shareTotal = measured.reduce((t, a) => t + (a.usedMs ?? 0), 0);
  const counts = { green: 0, yellow: 0, red: 0 };
  for (const a of summary.apps) if (a.status.level in counts) counts[a.status.level as keyof typeof counts]++;
  const limited = counts.green + counts.yellow + counts.red;

  return (
    <section aria-label={t('st.yourToday')} className="card relative overflow-hidden p-5 sm:p-6">
      <span className="pointer-events-none absolute -right-24 -top-28 w-80 h-80 rounded-full glow-teal" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-muted">{t('st.yourToday')}</h2>
          {summary.totalTodayMs === null ? (
            <p className="num mt-1 text-[46px] leading-none font-bold text-muted">—</p>
          ) : (
            <p
              className={clsx('num mt-1 text-[46px] leading-none font-extrabold', summary.measuring ? 'text-ink' : 'text-muted')}
              aria-label={summary.measuring ? formatDurationLong(summary.totalTodayMs) : t('st.storedEarlier', { duration: formatDurationLong(summary.totalTodayMs) })}
            >
              {formatDuration(summary.totalTodayMs)}
            </p>
          )}
          <p className="mt-2 text-[15px] text-muted">
            {summary.totalTodayMs === null
              ? tracking ? t('st.nothingYet') : t('st.offAccess')
              : !summary.measuring
                ? t('st.savedEarlier')
                : t('st.across', { count: summary.apps.length }) + (summary.averageMs !== null ? ` · ${t('st.usually', { duration: formatDuration(summary.averageMs) })}` : '')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={st.refresh}
          disabled={!tracking || st.refreshing}
          icon={justUpdated
            ? <Check size={15} strokeWidth={2.75} className="pop-in text-good" aria-hidden="true" />
            : <RefreshCw size={15} className={clsx(st.refreshing && 'animate-spin')} aria-hidden="true" />}
          className="shrink-0"
        >
          {st.refreshing ? t('st.refreshing') : justUpdated ? t('st.updatedShort') : t('st.refresh')}
        </Button>
      </div>

      {measured.length > 0 && shareTotal > 0 && (
        <div className="relative mt-5">
          <div className="flex h-3 rounded-full overflow-hidden gap-[2px] grow-x" aria-hidden="true">
            {measured.map((a, i) => (
              <span key={a.app.id} style={{ width: `${((a.usedMs ?? 0) / shareTotal) * 100}%`, background: BRAND_PALETTE[i % BRAND_PALETTE.length] }} />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label={t('st.shareLabel')}>
            {measured.slice(0, 5).map((a, i) => (
              <li key={a.app.id} className="flex items-center gap-1.5 text-xs text-ink-2">
                <span className="w-2 h-2 rounded-full" style={{ background: BRAND_PALETTE[i % BRAND_PALETTE.length] }} aria-hidden="true" />
                {label(a.app)} <span className="text-muted tabular-nums">{Math.round(((a.usedMs ?? 0) / shareTotal) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {limited > 0 && (
        <dl className="relative mt-5 grid grid-cols-3 gap-2">
          {([
            ['green', t('usage.level.green'), CheckCircle2, 'text-good'],
            ['yellow', t('usage.level.yellow'), Circle, 'text-warn'],
            ['red', t('usage.level.red'), AlertTriangle, 'text-bad'],
          ] as const).map(([k, name, Icon, cls]) => (
            <div key={k} className="tile px-3 py-2.5">
              <dt className={clsx('flex items-center gap-1 text-[11px] font-semibold', cls)}><Icon size={12} aria-hidden="true" />{name}</dt>
              <dd className="num mt-0.5 text-lg font-bold text-ink">{counts[k]}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="relative mt-4 pt-4 border-t border-line flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-2" role="status" aria-live="polite">
        <span className={clsx('inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-semibold', tracking ? (fresh === 'stale' ? 'bg-warn-soft text-warn' : 'bg-good-soft text-good') : 'bg-surface-2 text-muted')}>
          <span className={clsx('w-2 h-2 rounded-full shrink-0', state.dot)} aria-hidden="true" />
          {state.text}
        </span>
        <span className="text-muted">{when}</span>
      </p>
      {st.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{t('st.couldNotRefresh', { error: st.error })}</p>}
    </section>
  );
}

function LimitEditor({ st, appId, limit }: { st: ScreenTime; appId: string; limit: number | null }) {
  const options = LIMIT_PRESETS.includes(limit ?? -1) || limit === null ? LIMIT_PRESETS : [...LIMIT_PRESETS, limit].sort((a, b) => a - b);
  const app = getSupportedApp(appId);
  const label = useAppLabel();
  const t = useT();
  return (
    <select
      className="input w-auto shrink-0 min-h-[40px] !rounded-full !pl-3.5 text-[13px] py-1 font-semibold text-ink"
      value={limit ?? ''}
      aria-label={t('st.limitFor', { app: app ? label(app) : t('st.app') })}
      onChange={e => st.setLimit(appId, e.target.value === '' ? null : Number(e.target.value))}
    >
      <option value="">{t('st.noLimit')}</option>
      {options.map(m => <option key={m} value={m}>{t('st.limitOption', { duration: formatDuration(m * 60_000) })}</option>)}
    </select>
  );
}

function AppList({ st }: { st: ScreenTime }) {
  const label = useAppLabel();
  const t = useT();
  const [editApps, setEditApps] = useState(false);
  const selected = new Set(st.settings.apps.map(a => a.appId));
  return (
    <section aria-labelledby="apps-title" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="apps-title" className="section-heading">{t('st.yourApps')}</h2>
          <p className="text-sm text-muted mt-0.5">{t('st.yourAppsSub')}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditApps(v => !v)} aria-expanded={editApps} className="!text-brand-text font-semibold whitespace-nowrap shrink-0">
          {editApps ? t('common.done') : t('st.changeApps')}
        </Button>
      </div>

      {editApps && (
        <div className="space-y-2">
          <p className="text-sm text-muted">{t('st.tickNote')}</p>
          <AppPicker st={st} selected={selected} onToggle={st.toggleApp} />
        </div>
      )}

      {st.summary.apps.length === 0 ? (
        <div className="card flex flex-col items-center text-center px-6 py-8">
          <PhoneTimeArt className="w-20 h-20" />
          <p className="mt-3 font-display text-[17px] font-semibold text-ink">{t('st.noApps')}</p>
          <p className="mt-1 text-sm text-muted max-w-xs">{t('st.noAppsBody')}</p>
          {!editApps && <Button className="mt-4" onClick={() => setEditApps(true)}>{t('st.chooseApps')}</Button>}
        </div>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {st.summary.apps.map(a => {
            const meta = [
              a.sessions ? t('st.visits', { count: a.sessions }) : '',
              a.setting.limitIsDefault && a.setting.limitMinutes ? t('st.defaultLimitBadge') : '',
            ].filter(Boolean).join(' · ');
            return (
              <li key={a.app.id} className="px-4 sm:px-5 py-4">
                <div className="flex items-center gap-3">
                  <AppAvatar app={a.app} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[15px] font-semibold text-ink truncate">{label(a.app)}</p>
                      <p className={clsx('num shrink-0 text-[17px] font-bold', st.summary.measuring && a.usedMs !== null ? 'text-ink' : 'text-muted')}>
                        {a.usedMs === null ? '—' : formatDuration(a.usedMs)}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <UsageStatusBadge status={a.status} />
                      <span className="shrink-0 text-xs text-muted tabular-nums">
                        {a.usedMs === null
                          ? st.summary.measuring ? t('st.nothingToday') : t('st.notMeasured')
                          : !st.summary.measuring ? t('st.savedEarlierShort') : a.setting.limitMinutes ? t('st.ofLimit', { limit: formatLimit(a.setting.limitMinutes) }) : t('st.noLimit')}
                      </span>
                    </div>
                  </div>
                </div>
                {a.setting.limitMinutes ? <div className="mt-3"><UsageBar status={a.status} usedMs={a.usedMs} limitMinutes={a.setting.limitMinutes} label={label(a.app)} /></div> : null}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="min-w-0 text-xs text-muted leading-snug">{meta}</span>
                  <LimitEditor st={st} appId={a.app.id} limit={a.setting.limitMinutes} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function WeekChart({ st }: { st: ScreenTime }) {
  const { week, averageMs, measuredPastDays } = st.summary;
  const t = useT();
  const max = Math.max(1, ...week.map(d => d.totalMs ?? 0));
  const anyData = week.some(d => d.totalMs !== null);
  return (
    <section aria-labelledby="week-title" className="space-y-3">
      <div>
        <h2 id="week-title" className="section-heading">{t('st.last7')}</h2>
        <p className="text-sm text-muted mt-0.5">{t('st.last7Sub')}</p>
      </div>
      <div className="card p-5">
        {!anyData ? (
          <p className="py-4 text-center text-[15px] text-muted">{t('st.weekEmpty')}</p>
        ) : (
          <>
            <ul className="grid grid-cols-7 gap-2 items-end h-40" aria-label={t('st.perDay')}>
              {week.map((d, i) => {
                const isToday = i === week.length - 1;
                const h = d.totalMs === null ? 0 : Math.max(4, Math.round((d.totalMs / max) * 100));
                return (
                  <li key={d.day} className="flex flex-col items-center justify-end h-full gap-1.5" aria-label={`${dayLabel(d.day, 'long')}: ${d.totalMs === null ? t('st.dayNotMeasured') : formatDurationLong(d.totalMs)}`}>
                    <span className={clsx('text-[11px] tabular-nums', isToday ? 'font-semibold text-ink' : 'text-muted')} aria-hidden="true">{d.totalMs === null ? '' : formatDuration(d.totalMs)}</span>
                    <div className="w-full flex-1 flex items-end" aria-hidden="true">
                      {d.totalMs === null
                        ? <div className="w-full h-1 rounded-full border-t-2 border-dashed border-line-strong" />
                        : <div className={clsx('w-full rounded-[8px] grow-y', isToday ? 'bg-gradient-to-t from-cyan-500 to-cyan-300' : 'bg-gradient-to-t from-blue-600 to-blue-400')} style={{ height: `${h}%`, animationDelay: `${i * 45}ms` }} />}
                    </div>
                    <span className={clsx('text-xs', isToday ? 'font-semibold text-ink' : 'text-muted')} aria-hidden="true">{isToday ? t('common.today') : dayLabel(d.day)}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-sm text-muted">
              {averageMs !== null
                ? t('st.average', { count: measuredPastDays, duration: formatDuration(averageMs) })
                : t('st.averageHint')}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function Observations({ st }: { st: ScreenTime }) {
  const label = useAppLabel();
  const t = useT();
  const insights = buildUsageInsights(st.summary, label, formatDuration);
  const tips: string[] = [];
  if (st.summary.apps.length > 0 && st.summary.apps.every(a => !a.setting.limitMinutes)) tips.push(t('st.tipLimit'));
  if (!st.settings.alertsEnabled && st.summary.apps.some(a => a.setting.limitMinutes)) tips.push(t('st.tipAlerts'));
  if (insights.length === 0 && tips.length === 0) return null;
  return (
    <section aria-labelledby="obs-title" className="card relative overflow-hidden p-5 flex gap-3.5">
      <span className="pointer-events-none absolute -right-14 -top-14 w-44 h-44 rounded-full glow-purple" aria-hidden="true" />
      <IconTile tone="purple" size="lg" className="relative"><Sparkles size={19} /></IconTile>
      <div className="relative min-w-0">
      <h2 id="obs-title" className="text-xs font-semibold text-info">{t('insight.title')}</h2>
      <ul className="mt-1 space-y-2">
        {insights.map(i => <li key={i.id} className="text-[15px] leading-relaxed text-ink">{i.text}</li>)}
        {tips.map(tip => <li key={tip} className="text-sm leading-relaxed text-ink-2">{tip}</li>)}
      </ul>
      </div>
    </section>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────

function SettingRow({ label, sub, children }: { label: string; sub?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5">
      <div className="flex-1 min-w-[10rem]">
        <p className="text-[15px] font-medium text-ink">{label}</p>
        {sub && <p className="text-sm text-muted mt-0.5 leading-relaxed">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function TrackingSettings({ st }: { st: ScreenTime }) {
  const { hiddenMode } = usePrivacy();
  const t = useT();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notifNote, setNotifNote] = useState('');
  // Anything but 'granted' means alerts cannot be shown (Android 13+ resets a revoked permission to 'prompt').
  // The switch shows the saved preference, so "Off" always means no alerts will be sent.
  const notifState = st.status?.notifications;
  const alerts = limitAlertsState(st.settings.alertsEnabled, notifState);
  const notifDenied = notifState === 'denied';
  const usageOn = st.status?.usageAccess === 'granted';

  const onAlerts = async (on: boolean) => {
    setNotifNote('');
    const perm = await st.setAlertsEnabled(on);
    if (on && perm !== 'granted') setNotifNote(t('st.notifBlocked'));
  };

  return (
    <section aria-labelledby="st-settings-title" className="space-y-3">
      <h2 id="st-settings-title" className="section-heading flex items-center gap-2"><Settings2 size={17} className="text-muted" aria-hidden="true" />{t('st.settingsTitle')}</h2>
      <div className="card px-5 divide-y divide-line">
        {/* Both permissions side by side, so neither is mistaken for the other. */}
        <SettingRow label={t('st.usageAccess')} sub={usageOn ? t('st.usageNeeded') : t('st.usageNotMeasured')}>
          {usageOn ? <Badge variant="success"><Check size={11} aria-hidden="true" /> {t('st.allowed')}</Badge> : <Badge variant="warning">{t('st.off')}</Badge>}
        </SettingRow>
        <SettingRow label={t('st.notifications')} sub={t('st.notifOnly')}>
          {notifState === undefined ? <Badge>{t('st.checking')}</Badge> : notifState === 'granted' ? <Badge variant="success"><Check size={11} aria-hidden="true" /> {t('st.allowed')}</Badge> : <Badge variant="warning">{t('st.blocked')}</Badge>}
        </SettingRow>

        <div>
          <SettingRow
            label={t('st.limitAlerts')}
            sub={st.settings.alertsEnabled ? t('st.limitAlertsOn') : t('st.limitAlertsOff')}
          >
            <Switch checked={alerts.switchOn} onChange={onAlerts} label={t('st.limitAlerts')} />
          </SettingRow>
          {(notifNote || alerts.blocked) && (
            <div role="alert" className="mb-3.5 flex flex-wrap items-center gap-2 text-sm text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 rounded-xl px-3 py-2.5">
              <BellOff size={15} className="shrink-0" aria-hidden="true" />
              <span className="flex-1 min-w-[12rem] leading-relaxed">{notifNote || t('st.alertsBlocked')}</span>
              {notifDenied || notifNote
                ? <Button variant="outline" size="xs" onClick={() => void st.openNotificationSettings()}>{t('st.openSettings')}</Button>
                : <Button variant="outline" size="xs" onClick={() => void onAlerts(true)}>{t('st.allowNotifications')}</Button>}
            </div>
          )}
        </div>

        {st.settings.alertsEnabled && (
          <SettingRow label={t('st.nameApp')} sub={hiddenMode ? t('st.nameAppHidden') : t('st.nameAppOff')}>
            <Switch checked={st.settings.alertShowAppNames && !hiddenMode} disabled={hiddenMode} onChange={st.setShowAppNames} label={t('st.nameApp')} />
          </SettingRow>
        )}

        <SettingRow label={t('st.turnOffTitle')} sub={t('st.turnOffSub')}>
          <Button variant="outline" size="sm" icon={<Power size={14} />} onClick={st.disableTracking}>{t('st.turnOff')}</Button>
        </SettingRow>

        <div>
          <SettingRow label={t('st.deleteTitle')} sub={t('st.deleteSub')}>
            <Button variant="outline" size="sm" icon={<Trash2 size={14} />} onClick={() => setConfirmDelete(true)} disabled={confirmDelete}>{t('common.delete')}</Button>
          </SettingRow>
          {confirmDelete && (
            <div role="alertdialog" aria-labelledby="del-usage" className="mb-4 p-4 rounded-2xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 space-y-3 text-red-800 dark:text-red-300">
              <p id="del-usage" className="font-semibold text-sm">{t('st.deleteConfirmTitle')}</p>
              <p className="text-sm">{t('st.deleteConfirmBody')}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>{t('common.cancel')}</Button>
                <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={async () => { await st.deleteHistory(); setConfirmDelete(false); }}>{t('st.deleteTitle')}</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const t = useT();
  return (
    <Disclosure title={t('st.howTitle')} hint={t('st.howHint')}>
      <div className="space-y-4 text-sm text-ink-2 leading-relaxed">
        <ul className="space-y-2 list-disc pl-5 marker:text-muted">
          <li>{t('st.how1')}</li>
          <li>{t('st.how2', { pct: pct(USAGE_STATUS_THRESHOLDS.yellowFromRatio) })}</li>
          <li>{t('st.how3')}</li>
          <li>{t('st.how4')}</li>
          <li>{t('st.how5')}</li>
          <li>{t('st.how6')}</li>
          <li>{t('st.how7')}</li>
        </ul>
        <div className="pt-3 border-t border-line">
          <p className="font-semibold text-ink mb-2">{t('st.privacy')}</p>
          <WhatWeRead />
        </div>
      </div>
    </Disclosure>
  );
}

// ── Page body ─────────────────────────────────────────────────────────────────

export function ScreenTimeView({ st }: { st: ScreenTime }) {
  const t = useT();
  if (st.phase === 'loading') {
    return (
      <div role="status" aria-label={t('st.loading')} className="space-y-4">
        <div className="card p-5 space-y-4" aria-hidden="true">
          <span className="block h-3.5 w-36 rounded-full bg-surface-2 animate-pulse" />
          <span className="block h-11 w-44 rounded-xl bg-surface-2 animate-pulse" />
          <span className="block h-3 w-full rounded-full bg-surface-2 animate-pulse" />
        </div>
        <div className="card divide-y divide-line" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-4">
              <span className="w-11 h-11 rounded-[14px] bg-surface-2 animate-pulse" />
              <span className="flex-1 space-y-2"><span className="block h-3.5 w-28 rounded-full bg-surface-2 animate-pulse" /><span className="block h-2.5 w-full rounded-full bg-surface-2 animate-pulse" /></span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (st.phase === 'unsupported') return <ScreenTimeUnsupported />;
  if (!st.settings.trackingEnabled) return <ChooseApps st={st} />;
  if (!st.status) {
    return (
      <div className="card p-5">
        <p role="status" className="text-[15px] text-muted">{st.error ? t('st.statusError', { error: st.error }) : t('st.checkingAccess')}</p>
        {st.error && <Button className="mt-3" variant="outline" size="sm" onClick={st.refresh}>{t('common.tryAgain')}</Button>}
      </div>
    );
  }
  const granted = st.status.usageAccess === 'granted';
  return (
    <div className="space-y-6">
      {!granted && <NeedsAccess st={st} />}
      <div className="grid gap-6 lg:grid-cols-5 items-start">
        <div className="space-y-6 lg:col-span-3 min-w-0">
          <TodaySummary st={st} />
          <Observations st={st} />
          <AppList st={st} />
          <WeekChart st={st} />
        </div>
        <div className="space-y-6 lg:col-span-2 min-w-0">
          <TrackingSettings st={st} />
          <HowItWorks />
        </div>
      </div>
    </div>
  );
}
