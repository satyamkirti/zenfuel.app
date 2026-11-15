'use client';

import { useCallback } from 'react';
import { clsx } from 'clsx';
import {
  CheckCircle2, AlertCircle, AlertTriangle, MinusCircle, HelpCircle, PauseCircle, LucideIcon,
  Instagram, Youtube, Facebook, Ghost, MessagesSquare, Twitter, Music2, AtSign, Pin, Linkedin, Film, Tv, Twitch, Video,
  MessageCircle, Clapperboard, Send, Gamepad2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { usePrivacy } from '@/context/PrivacyContext';
import { SUPPORTED_APPS, SupportedApp } from '@/lib/usage/catalog';
import { UsageStatus, statusLabel, formatDuration, formatDurationLong } from '@/lib/usage/status';
import { useT } from '@/i18n/I18nProvider';
import { t as tr } from '@/i18n/translate';
import { formatClock as formatClockLocal, formatDateStyle } from '@/i18n/format';

const APP_INDEX = new Map(SUPPORTED_APPS.map((a, i) => [a.id, i + 1]));

/** App names follow Hidden Mode like habit names do: "Tracked app 3" until revealed. */
export function useAppLabel() {
  const { masked } = usePrivacy();
  const t = useT();
  return useCallback((app: SupportedApp) => (masked ? t('st.trackedApp', { n: String(APP_INDEX.get(app.id) ?? '') }).trim() : app.label), [masked, t]);
}

// Each app gets a recognisable glyph on its own signature colours (not its trademarked logo), so
// lists scan like a phone's app drawer. Hidden Mode shows a neutral dot instead, like habit icons.
const APP_STYLE: Record<string, { bg: string; icon: LucideIcon; dark?: boolean }> = {
  instagram: { bg: 'linear-gradient(135deg,#7a3cf0 0%,#e1306c 55%,#f7a03a 100%)', icon: Instagram },
  youtube: { bg: 'linear-gradient(135deg,#ff3b3b,#d70000)', icon: Youtube },
  facebook: { bg: 'linear-gradient(135deg,#3b8cff,#1662d6)', icon: Facebook },
  snapchat: { bg: 'linear-gradient(135deg,#fff86b,#f7e600)', icon: Ghost, dark: true },
  reddit: { bg: 'linear-gradient(135deg,#ff6a2b,#e83e00)', icon: MessagesSquare },
  x: { bg: 'linear-gradient(135deg,#2a2f33,#0b0d0e)', icon: Twitter },
  tiktok: { bg: 'linear-gradient(135deg,#1c1c1c,#000000)', icon: Music2 },
  threads: { bg: 'linear-gradient(135deg,#2a2f33,#0b0d0e)', icon: AtSign },
  pinterest: { bg: 'linear-gradient(135deg,#ff2c4a,#c8001f)', icon: Pin },
  linkedin: { bg: 'linear-gradient(135deg,#2a83e0,#0a58b0)', icon: Linkedin },
  netflix: { bg: 'linear-gradient(135deg,#1c1c1c,#000000)', icon: Film },
  'prime-video': { bg: 'linear-gradient(135deg,#29b8f0,#0a84c4)', icon: Tv },
  twitch: { bg: 'linear-gradient(135deg,#a36bff,#7a3cf0)', icon: Twitch },
  moj: { bg: 'linear-gradient(135deg,#ffb23e,#f0663a)', icon: Video },
  sharechat: { bg: 'linear-gradient(135deg,#ffc23e,#f5a000)', icon: MessageCircle, dark: true },
  josh: { bg: 'linear-gradient(135deg,#ff5a6e,#e0203c)', icon: Clapperboard },
  whatsapp: { bg: 'linear-gradient(135deg,#43e07f,#16b45a)', icon: MessageCircle },
  telegram: { bg: 'linear-gradient(135deg,#3ab4f0,#1a8fd0)', icon: Send },
  discord: { bg: 'linear-gradient(135deg,#7b86ff,#5160e8)', icon: Gamepad2 },
};

export function AppAvatar({ app, size = 'md' }: { app: SupportedApp; size?: 'sm' | 'md' | 'lg' }) {
  const { masked } = usePrivacy();
  const box = size === 'lg' ? 'w-11 h-11 rounded-[14px]' : size === 'sm' ? 'w-8 h-8 rounded-[10px]' : 'w-10 h-10 rounded-xl';
  const iconSize = size === 'lg' ? 22 : size === 'sm' ? 16 : 19;
  if (masked) {
    return <span className={clsx(box, 'shrink-0 bg-surface-2 text-ink-2 flex items-center justify-center font-semibold')} aria-hidden="true">•</span>;
  }
  const style = APP_STYLE[app.id];
  const Icon = style?.icon;
  return (
    <span
      className={clsx(box, 'shrink-0 shadow-sm ring-1 ring-inset ring-white/10 flex items-center justify-center font-bold', style?.dark ? 'text-charcoal-950' : 'text-white', !style && 'bg-gradient-to-br from-sky-400 to-blue-600')}
      style={style ? { background: style.bg } : undefined}
      aria-hidden="true"
    >
      {Icon ? <Icon size={iconSize} strokeWidth={2} /> : app.label.charAt(0)}
    </span>
  );
}

const BADGE: Record<UsageStatus['level'], { variant: 'success' | 'warning' | 'danger' | 'default'; icon: typeof CheckCircle2 }> = {
  green: { variant: 'success', icon: CheckCircle2 },
  yellow: { variant: 'warning', icon: AlertCircle },
  red: { variant: 'danger', icon: AlertTriangle },
  'no-limit': { variant: 'default', icon: MinusCircle },
  'no-data': { variant: 'default', icon: HelpCircle },
  'not-measuring': { variant: 'default', icon: PauseCircle },
};

/** Status is always shown as an icon plus words, never colour alone. */
export function UsageStatusBadge({ status }: { status: UsageStatus }) {
  const { variant, icon: Icon } = BADGE[status.level];
  return (
    <Badge variant={variant}>
      <Icon size={12} aria-hidden="true" />
      {statusLabel(status)}
    </Badge>
  );
}

// Usage bars are blue while under the limit; the status dot and badge carry green / yellow / red.
export const BAR: Record<UsageStatus['level'], string> = {
  green: 'bg-gradient-to-r from-sky-400 to-blue-600',
  yellow: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  red: 'bg-gradient-to-r from-red-400 to-red-600',
  'no-limit': 'bg-gradient-to-r from-cyan-400 to-blue-500',
  'no-data': 'bg-line-strong',
  'not-measuring': 'bg-line-strong',
};

/** Small status dot colour (green / yellow / red), always paired with words. */
export const DOT: Record<UsageStatus['level'], string> = {
  green: 'bg-good',
  yellow: 'bg-warn',
  red: 'bg-bad',
  'no-limit': 'bg-brand',
  'no-data': 'bg-line-strong',
  'not-measuring': 'bg-line-strong',
};

export function UsageBar({ status, usedMs, limitMinutes, label }: { status: UsageStatus; usedMs: number | null; limitMinutes: number | null; label: string }) {
  const t = useT();
  if (status.ratio === null || usedMs === null || !limitMinutes) {
    return <div className="track h-2.5" aria-hidden="true" />;
  }
  const pct = Math.min(100, Math.round(status.ratio * 100));
  return (
    <div
      className="track h-2.5 overflow-hidden"
      role="progressbar"
      aria-label={t('st.barLabel', { app: label })}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={t('st.barValue', { used: formatDurationLong(usedMs), limit: formatDurationLong(limitMinutes * 60_000) })}
    >
      <div className={clsx('h-full rounded-full grow-x transition-[width] duration-500', BAR[status.level])} style={{ width: `${Math.max(pct, usedMs > 0 ? 3 : 0)}%` }} />
    </div>
  );
}

export function formatLimit(minutes: number | null): string {
  return minutes ? formatDuration(minutes * 60_000) : tr('st.noLimit');
}

export function formatClock(ms: number): string {
  return formatClockLocal(ms);
}

export function formatAgo(ms: number, now: number): string {
  const min = Math.max(0, Math.round((now - ms) / 60_000));
  if (min < 1) return tr('st.justNow');
  if (min < 60) return tr('st.minAgo', { count: min });
  return tr('st.atTime', { time: formatClock(ms) });
}

export function dayLabel(day: string, style: 'short' | 'long' = 'short'): string {
  return formatDateStyle(day, style === 'short' ? 'weekdayShort' : 'weekdayDayMonth');
}
