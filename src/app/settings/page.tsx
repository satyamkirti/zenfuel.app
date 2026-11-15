'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Shield, Moon, Sun, Lock, Unlock, Download, Upload, Trash2, Check, AlertTriangle, Brain, Bell, Crown, Zap, EyeOff, FileSpreadsheet } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, IconTile, Tone, TONE } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { Disclosure } from '@/components/ui/Disclosure';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { usePrivacy, DEFAULT_HIDDEN_TITLE } from '@/context/PrivacyContext';
import { APP_VERSION } from '@/lib/version';
import { PageHeader } from '@/components/ui/PageHeader';
import { PlanBadge } from '@/components/subscription/PlanBadge';
import { PLANS, MONETIZATION_UI_ENABLED } from '@/utils/subscription';
import { storage } from '@/utils/storage';
import { exportToCSV, exportFullBackup } from '@/utils/export';
import { parseBackupText, applyBackup, ParsedBackup, BackupSummary, RestoreMode, MAX_BACKUP_BYTES } from '@/utils/backup';
import { formatDisplayDate } from '@/utils/dateUtils';
import { useUsagePlatform } from '@/hooks/useScreenTime';
import {
  getNotificationPrefs, saveNotificationPrefs, requestPermission, getPermissionStatus, getNotificationSupport,
  getDefaultNotificationPrefs, registerNotificationWorker, showNotification, NotificationPrefs, NotificationSupport,
} from '@/lib/notifications';
import { useT } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/translate';
import { formatDateTime } from '@/i18n/format';
import { LanguageRegionSettings } from '@/components/settings/LanguageRegionSettings';
import { Globe2 } from 'lucide-react';
import { t as tr } from '@/i18n/translate';

// Restore and Clear All reload the page so every part of the app re-reads storage
// (theme, PIN lock, reminders). The outcome is shown once after the reload.
const FLASH_KEY = 'zenfuel_settings_flash';

function reloadWithMessage(message: string) {
  try { sessionStorage.setItem(FLASH_KEY, message); } catch {}
  window.location.reload();
}

function describeBackup(s: BackupSummary): string {
  const parts = [tr('backup.entries', { count: s.entryCount })];
  if (s.customHabitCount !== null) parts.push(tr('backup.customHabits', { count: s.customHabitCount }));
  if (s.goalCount !== null) parts.push(tr('backup.goals', { count: s.goalCount }));
  if (s.customChallengeCount !== null) parts.push(tr('backup.customChallenges', { count: s.customChallengeCount }));
  if (s.includesSettings) parts.push(tr('backup.settings'));
  return parts.join(', ');
}

function dateRange(s: BackupSummary): string {
  if (!s.firstEntryDate || !s.lastEntryDate) return '';
  return s.firstEntryDate === s.lastEntryDate
    ? ` (${formatDisplayDate(s.firstEntryDate)})`
    : ` (${formatDisplayDate(s.firstEntryDate)} – ${formatDisplayDate(s.lastEntryDate)})`;
}

// A settings group: a small label above one card, the same pattern as the More menu.
function Section({ title, icon, tone = 'blue', children }: { title: string; icon: React.ReactNode; tone?: Tone; children: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="flex items-center gap-2 px-1 mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
        <span className={TONE[tone].text} aria-hidden="true">{icon}</span>{title}
      </h2>
      <Card padding="none">
        <div className="p-4 sm:p-5 space-y-4">{children}</div>
      </Card>
    </section>
  );
}

// One setting: optional icon tile, name and explanation, and its control on the right.
function Row({ label, sub, icon, tone = 'teal', children }: { label: string; sub?: string; icon?: React.ReactNode; tone?: Tone; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2">
      {icon && <IconTile tone={tone} size="lg">{icon}</IconTile>}
      <div className="flex-1 min-w-[9rem]">
        <p className="text-[15px] font-semibold text-ink">{label}</p>
        {sub && <p className="text-[13px] text-muted mt-0.5 leading-snug">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, entries, habits, goals, challenges, clearAll, pinEnabled, enablePin, disablePin, autoLockMinutes, updateAutoLock, subscription, isPremium, daysLeft, trialDaysLeft, cancelSubscription } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const t = useT();
  const [pinStep, setPinStep] = useState<'idle' | 'enter' | 'confirm'>('idle');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinError, setPinError] = useState('');
  const { hiddenMode, storedHiddenTitle, setHiddenMode, setHiddenTitle, appName } = usePrivacy();
  const usagePlatform = useUsagePlatform();
  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<ParsedBackup | null>(null);
  const [importError, setImportError] = useState('');
  const [flash, setFlash] = useState('');
  const restoreRef = useRef<HTMLDivElement>(null);
  const importErrorRef = useRef<HTMLDivElement>(null);

  // On a phone the preview/error renders below the fold; bring it into view and move focus to it.
  useEffect(() => {
    const el = pendingRestore ? restoreRef.current : importError ? importErrorRef.current : null;
    if (!el) return;
    // Instant scroll (the element is already in the DOM here); a smooth scroll can be cancelled.
    el.scrollIntoView({ block: 'center' });
    el.focus({ preventScroll: true });
  }, [pendingRestore, importError]);

  useEffect(() => {
    try {
      const message = sessionStorage.getItem(FLASH_KEY);
      if (message) { setFlash(message); sessionStorage.removeItem(FLASH_KEY); }
    } catch {}
  }, []);

  const customHabitCount = habits.filter(h => !h.isDefault).length;
  const customChallengeCount = challenges.filter(c => !c.isBuiltIn).length;

  // Notification state (read after mount so the server render and the first client render match)
  const [notifSupport, setNotifSupport] = useState<NotificationSupport>('supported');
  const [notifPerms, setNotifPerms] = useState<NotificationPermission>('default');
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(getDefaultNotificationPrefs);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    setNotifSupport(getNotificationSupport());
    setNotifPerms(getPermissionStatus());
    setNotifPrefs(getNotificationPrefs());
  }, []);

  const handleEnableNotifications = async () => {
    const perm = await requestPermission();
    setNotifPerms(perm);
    if (perm === 'granted') {
      void registerNotificationWorker();
      const prefs = { ...notifPrefs, enabled: true };
      saveNotificationPrefs(prefs);
      setNotifPrefs(prefs);
    }
  };

  const handleTestNotification = async () => {
    setTestResult('');
    const ok = await showNotification(hiddenMode ? appName : t('settings.testTitle'), hiddenMode ? t('notify.discreetBody') : t('settings.testBody'), 'zenfuel-test');
    setTestResult(ok ? t('settings.testSent') : t('settings.testFailed'));
  };

  // Saving fires an event; the app-wide scheduler reschedules with the current score.
  const updateNotifPref = (updates: Partial<NotificationPrefs>) => {
    const next = { ...notifPrefs, ...updates };
    saveNotificationPrefs(next);
    setNotifPrefs(next);
  };

  const handleSetPin = () => {
    if (pinStep === 'idle') { setPinStep('enter'); setPin1(''); setPin2(''); setPinError(''); }
    else if (pinStep === 'enter') {
      if (pin1.length < 4) { setPinError(t('settings.pinTooShort')); return; }
      setPinStep('confirm');
    } else {
      if (pin1 !== pin2) { setPinError(t('settings.pinMismatch')); setPinStep('enter'); setPin2(''); return; }
      enablePin(pin1);
      setPinStep('idle'); setPin1(''); setPin2('');
    }
  };

  // Step 1: read and fully validate the file. Nothing is written until the user confirms.
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    setImportError(''); setPendingRestore(null); setFlash(''); setConfirmClear(false);
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) { setImportError(t('settings.tooLarge')); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseBackupText(String(ev.target?.result ?? ''));
      if (parsed.ok) setPendingRestore(parsed.backup);
      else setImportError(parsed.error);
    };
    reader.onerror = () => setImportError(t('settings.unreadable'));
    reader.readAsText(file);
  };

  // Step 2: apply after explicit confirmation.
  const handleRestore = (mode: RestoreMode) => {
    if (!pendingRestore) return;
    const before = storage.getEntries().length;
    const result = applyBackup(pendingRestore, mode);
    if (!result.ok) { setPendingRestore(null); setImportError(result.error); return; }
    if (pendingRestore.kind === 'full') reloadWithMessage(t('settings.restoredFull', { count: result.entryCount }));
    else if (mode === 'merge') {
      const added = storage.getEntries().length - before;
      reloadWithMessage(t('settings.restoredMerge', { count: added }));
    }
    else reloadWithMessage(t('settings.restoredReplace', { count: result.entryCount }));
  };

  const handleClearAll = () => {
    clearAll();
    reloadWithMessage(t('settings.cleared'));
  };

  return (
    <AppLayout title={t('settings.title')}>
      <div className="space-y-4 max-w-3xl">
        <PageHeader icon={<Settings size={21} />} tone="slate" title={t('settings.title')} description={usagePlatform === 'android' ? t('settings.descPhone') : t('settings.descBrowser')} />

        <Section title={t('prefs.sectionTitle')} tone="blue" icon={<Globe2 size={16} />}>
          <LanguageRegionSettings />
        </Section>

        {/* Subscription — future paid plans only, hidden during the Free Beta */}
        {MONETIZATION_UI_ENABLED && (
          <Section title={t('settings.subscription')} tone="amber" icon={<Crown size={16} />}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zen-500 to-zen-700 flex items-center justify-center">
                  {isPremium ? <Zap size={18} className="text-white" /> : <Crown size={18} className="text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{isPremium ? PLANS[subscription.plan].name : t('settings.freePlan')}</p>
                    <PlanBadge plan={subscription.plan} size="xs" />
                  </div>
                  {subscription.status === 'trial' && trialDaysLeft !== null && (
                    <p className="text-xs text-zen-500">{t('settings.trialEnds', { count: trialDaysLeft })}</p>
                  )}
                  {isPremium && daysLeft !== null && (
                    <p className="text-xs text-muted">{t('settings.premiumEnds', { count: daysLeft })}</p>
                  )}
                  {isPremium && subscription.plan === 'lifetime' && (
                    <p className="text-xs text-emerald-500">{t('settings.forever')}</p>
                  )}
                  {!isPremium && (
                    <p className="text-xs text-muted">{t('settings.freeFeatures')}</p>
                  )}
                </div>
              </div>
              {isPremium ? (
                <Button variant="outline" size="sm" onClick={cancelSubscription}>{t('settings.downgrade')}</Button>
              ) : (
                <Link href="/upgrade" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-[transform,box-shadow,background-color,border-color,color,opacity]">
                  {t('settings.upgrade')}
                </Link>
              )}
            </div>
          </Section>
        )}

        {/* Notifications */}
        <Section title={t('settings.reminders')} tone="amber" icon={<Bell size={16} />}>
          {usagePlatform === 'android' || notifSupport !== 'supported' ? (
            <div className="flex items-start gap-3 p-3 bg-surface-2 rounded-xl text-sm text-ink-2">
              <Bell size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
              {usagePlatform === 'android'
                ? <span>{t('settings.remindersAndroid')} <Link href="/screen-time" className="text-brand-text hover:underline">{t('nav.screenTime')}</Link>.</span>
                : notifSupport === 'install-required'
                ? t('settings.remindersIos')
                : t('settings.remindersUnsupported')}
            </div>
          ) : notifPerms === 'denied' ? (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              {t('settings.remindersBlocked')}
            </div>
          ) : notifPerms !== 'granted' ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">{t('settings.remindersIntro')}</p>
              <Button size="sm" icon={<Bell size={14} />} onClick={handleEnableNotifications}>
                {t('settings.turnOnReminders')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Row label={t('settings.reminders')} sub={notifPrefs.enabled ? t('settings.remindersOn') : t('common.off')}>
                <Switch checked={notifPrefs.enabled} onChange={v => updateNotifPref({ enabled: v })} label={t('settings.reminders')} />
              </Row>
              <Row label={t('settings.yourName')} sub={t('settings.yourNameSub')}>
                <input type="text" value={notifPrefs.userName} onChange={e => updateNotifPref({ userName: e.target.value })} placeholder={t('settings.namePlaceholder')} aria-label={t('settings.yourName')} className="input w-32 text-sm" maxLength={20} />
              </Row>
              <div className="h-px bg-line" />
              <Row label={t('settings.morning')} sub={t('settings.morningSub')}>
                <div className="flex items-center gap-2">
                  <input type="time" value={notifPrefs.morningTime} onChange={e => updateNotifPref({ morningTime: e.target.value })} disabled={!notifPrefs.morningEnabled} aria-label={t('settings.morningTime')} className="input w-auto text-sm py-1 disabled:opacity-50" />
                  <Switch checked={notifPrefs.morningEnabled} onChange={v => updateNotifPref({ morningEnabled: v })} label={t('settings.morning')} />
                </div>
              </Row>
              <Row label={t('settings.evening')} sub={t('settings.eveningSub')}>
                <div className="flex items-center gap-2">
                  <input type="time" value={notifPrefs.eveningTime} onChange={e => updateNotifPref({ eveningTime: e.target.value })} disabled={!notifPrefs.eveningEnabled} aria-label={t('settings.eveningTime')} className="input w-auto text-sm py-1 disabled:opacity-50" />
                  <Switch checked={notifPrefs.eveningEnabled} onChange={v => updateNotifPref({ eveningEnabled: v })} label={t('settings.evening')} />
                </div>
              </Row>
              <Row label={t('settings.risk')} sub={t('settings.riskSub')}>
                <div className="flex items-center gap-2">
                  <input type="time" value={notifPrefs.vulnerableTime} onChange={e => updateNotifPref({ vulnerableTime: e.target.value })} disabled={!notifPrefs.vulnerableEnabled} aria-label={t('settings.riskTime')} className="input w-auto text-sm py-1 disabled:opacity-50" />
                  <Switch checked={notifPrefs.vulnerableEnabled} onChange={v => updateNotifPref({ vulnerableEnabled: v })} label={t('settings.risk')} />
                </div>
              </Row>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" icon={<Bell size={14} />} onClick={handleTestNotification}>{t('settings.sendTest')}</Button>
                {testResult && <p role="status" className="text-xs text-muted flex-1 min-w-[12rem]">{testResult}</p>}
              </div>
              <p className="text-xs text-muted bg-surface-2 rounded-xl px-3 py-2 leading-relaxed">
                {t('settings.remindersNote', { app: appName })}
                {hiddenMode && ` ${t('settings.remindersHidden')}`}
              </p>
            </div>
          )}
        </Section>

        <Section title={t('settings.appearance')} tone="yellow" icon={<Sun size={16} />}>
          <div>
            <div className="flex items-center gap-3.5">
              <IconTile tone="yellow" size="lg">{theme === 'dark' ? <Moon size={19} /> : <Sun size={19} />}</IconTile>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-ink">{t('common.theme')}</p>
                <p className="text-[13px] text-muted mt-0.5 leading-snug">{t('settings.themeSub')}</p>
              </div>
            </div>
            <Segmented
              label={t('common.theme')}
              className="mt-3 w-full sm:max-w-xs"
              value={theme === 'light' ? 'light' : 'dark'}
              onChange={setTheme}
              options={[{ value: 'light', label: t('common.light'), icon: <Sun size={15} aria-hidden="true" /> }, { value: 'dark', label: t('common.dark'), icon: <Moon size={15} aria-hidden="true" /> }]}
            />
          </div>
        </Section>

        <Section title={t('settings.privacy')} tone="green" icon={<Shield size={16} />}>
          <Row label={t('settings.pin')} sub={pinEnabled ? t('settings.pinOn') : t('settings.pinOff')} icon={<Lock size={19} />} tone="teal">
            {pinEnabled
              ? <Button variant="outline" size="sm" icon={<Unlock size={14} />} onClick={disablePin}>{t('settings.disablePin')}</Button>
              : <Button variant="secondary" size="sm" icon={<Lock size={14} />} onClick={() => setPinStep('enter')}>{t('settings.setPin')}</Button>
            }
          </Row>
          {pinStep !== 'idle' && !pinEnabled && (
            <div className="p-4 bg-surface-2 rounded-xl space-y-3">
              <label htmlFor="pin-input" className="block text-sm font-medium text-ink-2">{pinStep === 'enter' ? t('settings.enterNewPin') : t('settings.enterPinAgain')}</label>
              <input id="pin-input" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="off"
                onKeyDown={e => { if (e.key === 'Enter') handleSetPin(); }}
                value={pinStep === 'enter' ? pin1 : pin2}
                onChange={e => pinStep === 'enter' ? setPin1(e.target.value.replace(/\D/g, '')) : setPin2(e.target.value.replace(/\D/g, ''))}
                placeholder="••••" className="input text-center tracking-widest text-lg" />
              {pinError && <p role="alert" className="text-xs text-red-500">{pinError}</p>}
              <p className="text-xs text-muted">{t('settings.pinWarning', { app: appName })}</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setPinStep('idle'); setPin1(''); setPin2(''); setPinError(''); }}>{t('common.cancel')}</Button>
                <Button size="sm" onClick={handleSetPin}>{pinStep === 'enter' ? t('settings.next') : t('settings.savePin')}</Button>
              </div>
            </div>
          )}
          {pinEnabled && (
            <Row label={t('settings.autoLock')} sub={t('settings.autoLockSub')}>
              <select value={autoLockMinutes} onChange={e => updateAutoLock(Number(e.target.value))} aria-label={t('settings.autoLock')} className="input w-auto text-sm py-1.5">
                {[1, 2, 5, 10, 15, 30, 60].map(m => <option key={m} value={m}>{t('settings.minutesOption', { count: m })}</option>)}
              </select>
            </Row>
          )}
          <div className="h-px bg-line" />
          <Row label={t('privacy.hiddenMode')} sub={t('settings.hiddenSub')} icon={<EyeOff size={19} />} tone="purple">
            <Switch checked={hiddenMode} onChange={setHiddenMode} label={t('privacy.hiddenMode')} />
          </Row>
          {hiddenMode && (
            <Row label={t('settings.neutralTitle')} sub={t('settings.neutralTitleSub')}>
              <input type="text" value={storedHiddenTitle === DEFAULT_HIDDEN_TITLE ? '' : storedHiddenTitle} onChange={e => setHiddenTitle(e.target.value)} aria-label={t('settings.neutralTitle')} className="input w-44 text-sm" placeholder={t('privacy.defaultTitle')} maxLength={40} />
            </Row>
          )}
          <Disclosure variant="plain" title={t('settings.hiddenHow')}>
            <div className="text-sm text-muted leading-relaxed space-y-2">
              <p>{t('settings.hiddenHow1')}</p>
              <p>{t('settings.hiddenHow2')}</p>
              <p>{t('settings.hiddenHow3')}</p>
            </div>
          </Disclosure>
        </Section>

        <Section title={t('settings.data')} tone="cyan" icon={<Download size={16} />}>
          {flash && (
            <div role="status" className="flex items-start gap-2 px-3 py-2 rounded-lg text-sm bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <Check size={14} className="shrink-0 mt-0.5" />
              {flash}
            </div>
          )}
          {hiddenMode && (
            <p className="text-xs text-ink-2 bg-surface-2 rounded-xl px-3 py-2">
              {t('settings.hiddenBackups')}
            </p>
          )}
          <Row label={t('settings.backup')} sub={t('settings.backupSub')} icon={<Download size={19} />} tone="cyan">
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportFullBackup}>{t('settings.exportBackup')}</Button>
          </Row>
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs leading-relaxed bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>{t('settings.notEncryptedTitle')}</strong> {t('settings.notEncryptedBody')}
            </span>
          </div>
          <Row label={t('settings.csv')} sub={t('settings.csvSub')} icon={<FileSpreadsheet size={19} />} tone="emerald">
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => exportToCSV(entries, habits)}>{t('settings.exportCsv')}</Button>
          </Row>
          <Row label={t('settings.restore')} sub={t('settings.restoreSub')} icon={<Upload size={19} />} tone="purple">
            <div>
              <input type="file" accept=".json,application/json" ref={fileRef} onChange={handleImport} className="hidden" />
              <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => fileRef.current?.click()}>{t('settings.import')}</Button>
            </div>
          </Row>
          <Disclosure variant="plain" title={t('settings.backupContains')}>
            <p className="text-sm text-muted leading-relaxed">{t('settings.backupContainsBody')}</p>
          </Disclosure>

          {importError && (
            <div ref={importErrorRef} tabIndex={-1} role="alert" className="flex items-start gap-2 px-3 py-2 rounded-lg text-sm bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 outline-none">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{importError} {t('settings.nothingChanged')}</span>
            </div>
          )}

          {pendingRestore && (
            <div ref={restoreRef} tabIndex={-1} role="alertdialog" aria-labelledby="restore-title" className="p-4 rounded-xl border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 space-y-3 text-amber-900 dark:text-amber-200 outline-none scroll-mt-32">
              {pendingRestore.kind === 'full' ? (
                <>
                  <p id="restore-title" className="font-semibold text-sm flex items-center gap-2"><AlertTriangle size={15} className="shrink-0" /> {t('settings.replaceTitle')}</p>
                  <ul className="text-xs space-y-1 list-disc ml-5 opacity-90">
                    {pendingRestore.exportedAt && <li>{t('settings.backupCreated', { date: formatDateTime(new Date(pendingRestore.exportedAt)) })}</li>}
                    <li>{t('settings.backupHas', { summary: describeBackup(pendingRestore.summary) + dateRange(pendingRestore.summary) })}</li>
                    <li>{t('settings.deviceHas', { entries: t('backup.entries', { count: entries.length }), habits: t('backup.customHabits', { count: customHabitCount }), goals: t('backup.goals', { count: goals.length }), challenges: t('backup.customChallenges', { count: customChallengeCount }) })}</li>
                    {pendingRestore.summary.pinEnabled && <li>{t('settings.backupPin')}</li>}
                  </ul>
                  <p className="text-xs font-semibold">{t('settings.replaceWarning')}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setPendingRestore(null)}>{t('common.cancel')}</Button>
                    <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportFullBackup}>{t('settings.backupFirst')}</Button>
                    <Button variant="danger" size="sm" onClick={() => handleRestore('replace')}>{t('settings.replaceAll')}</Button>
                  </div>
                </>
              ) : (
                <>
                  <p id="restore-title" className="font-semibold text-sm flex items-center gap-2"><AlertTriangle size={15} className="shrink-0" /> {t('settings.olderTitle')}</p>
                  <ul className="text-xs space-y-1 list-disc ml-5 opacity-90">
                    <li>{t('settings.fileHas', { entries: t('backup.entries', { count: pendingRestore.summary.entryCount }) + dateRange(pendingRestore.summary) })}</li>
                    <li>{t('settings.deviceEntries', { entries: t('backup.entries', { count: entries.length }) })}</li>
                    <li>{t('settings.olderUnchanged')}</li>
                  </ul>
                  <p className="text-xs">{t('settings.addOrReplace')}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setPendingRestore(null)}>{t('common.cancel')}</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleRestore('merge')}>{t('settings.addEntries')}</Button>
                    <Button variant="danger" size="sm" onClick={() => handleRestore('replace')}>{t('settings.replaceEntries')}</Button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-line">
            <Row label={t('settings.clearAll')} sub={t('settings.clearAllSub')} icon={<Trash2 size={19} />} tone="red">
              <Button variant="outline" size="sm" icon={<Trash2 size={14} />} onClick={() => { setConfirmClear(true); setPendingRestore(null); }} disabled={confirmClear}>{t('settings.clearButton')}</Button>
            </Row>
            {confirmClear && (
              <div role="alertdialog" aria-labelledby="clear-title" className="mt-3 p-4 rounded-xl border-2 border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 space-y-3 text-red-800 dark:text-red-300">
                <p id="clear-title" className="font-semibold text-sm flex items-center gap-2"><AlertTriangle size={15} className="shrink-0" aria-hidden="true" /> {t('settings.clearTitle', { app: appName })}</p>
                <ul className="text-xs space-y-1 list-disc ml-5 opacity-90">
                  <li>
                    {entries.length === 0
                      ? t('settings.clearEntriesNone')
                      : t('settings.clearEntries', { count: entries.length })}
                  </li>
                  <li>{t('settings.clearGoals')}</li>
                  <li>{t('settings.clearSettings')}</li>
                  <li>{t('settings.clearNotifications')}</li>
                  <li>{t('settings.clearMisc')}</li>
                  {usagePlatform === 'android' && <li>{t('settings.clearUsage')}</li>}
                </ul>
                <p className="text-xs">{t('settings.clearKept')} <strong>{t('settings.cannotUndo')}</strong></p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>{t('common.cancel')}</Button>
                  <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportFullBackup}>{t('settings.backUpFirstShort')}</Button>
                  <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={handleClearAll}>{t('settings.deleteEverything')}</Button>
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title={t('settings.about')} tone="blue" icon={<Brain size={16} />}>
          <div className="space-y-2 text-sm text-muted">
            {([
              ['settings.aboutApp', appName],
              ['settings.aboutVersion', t('settings.aboutVersionValue', { version: APP_VERSION })],
              ['settings.aboutPlan', t('settings.aboutPlanValue')],
              ['settings.aboutHabits', habits.length],
              ['settings.aboutTotal', entries.length],
              ['settings.aboutData', t('settings.aboutDataValue'), true],
              ['settings.aboutAnalytics', t('settings.aboutAnalyticsValue')],
            ] as [MessageKey, string | number, boolean?][]).map(([label, value, good]) => (
              <div key={label} className="flex justify-between gap-4">
                <span>{t(label)}</span>
                <span className={`font-medium text-right ${good ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink'}`}>{value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
