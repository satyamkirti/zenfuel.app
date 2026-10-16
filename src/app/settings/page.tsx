'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Shield, Moon, Sun, Lock, Unlock, Download, Upload, Trash2, Check, AlertTriangle, Brain, Bell, Crown, Zap, EyeOff } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { usePrivacy, DEFAULT_HIDDEN_TITLE } from '@/context/PrivacyContext';
import { APP_VERSION } from '@/lib/version';
import { PlanBadge } from '@/components/subscription/PlanBadge';
import { PLANS, MONETIZATION_UI_ENABLED } from '@/utils/subscription';
import { storage } from '@/utils/storage';
import { exportToCSV, exportFullBackup } from '@/utils/export';
import { parseBackupText, applyBackup, ParsedBackup, BackupSummary, RestoreMode, MAX_BACKUP_BYTES } from '@/utils/backup';
import { formatDisplayDate } from '@/utils/dateUtils';
import {
  getNotificationPrefs, saveNotificationPrefs, requestPermission, getPermissionStatus, getNotificationSupport,
  getDefaultNotificationPrefs, registerNotificationWorker, showNotification, NotificationPrefs, NotificationSupport,
} from '@/lib/notifications';

// Restore and Clear All reload the page so every part of the app re-reads storage
// (theme, PIN lock, reminders). The outcome is shown once after the reload.
const FLASH_KEY = 'zenfuel_settings_flash';

function reloadWithMessage(message: string) {
  try { sessionStorage.setItem(FLASH_KEY, message); } catch {}
  window.location.reload();
}

function describeBackup(s: BackupSummary): string {
  const parts = [`${s.entryCount} entr${s.entryCount === 1 ? 'y' : 'ies'}`];
  if (s.customHabitCount !== null) parts.push(`${s.customHabitCount} custom habit${s.customHabitCount === 1 ? '' : 's'}`);
  if (s.goalCount !== null) parts.push(`${s.goalCount} goal${s.goalCount === 1 ? '' : 's'}`);
  if (s.customChallengeCount !== null) parts.push(`${s.customChallengeCount} custom challenge${s.customChallengeCount === 1 ? '' : 's'}`);
  if (s.includesSettings) parts.push('settings');
  return parts.join(', ');
}

function dateRange(s: BackupSummary): string {
  if (!s.firstEntryDate || !s.lastEntryDate) return '';
  return s.firstEntryDate === s.lastEntryDate
    ? ` (${formatDisplayDate(s.firstEntryDate)})`
    : ` (${formatDisplayDate(s.firstEntryDate)} – ${formatDisplayDate(s.lastEntryDate)})`;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <span className="text-violet-500">{icon}</span>
        <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </Card>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex-1 min-w-[10rem]">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, entries, habits, goals, challenges, clearAll, pinEnabled, enablePin, disablePin, autoLockMinutes, updateAutoLock, subscription, isPremium, daysLeft, trialDaysLeft, cancelSubscription } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pinStep, setPinStep] = useState<'idle' | 'enter' | 'confirm'>('idle');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinError, setPinError] = useState('');
  const { hiddenMode, storedHiddenTitle, setHiddenMode, setHiddenTitle, appName } = usePrivacy();
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
    const ok = await showNotification(hiddenMode ? appName : 'ZenFuel test reminder', hiddenMode ? 'You have a reminder.' : 'Reminders are working on this device.', 'zenfuel-test');
    setTestResult(ok ? 'Test sent. If nothing appeared, check your device\'s notification settings for this browser.' : 'This browser could not show a notification.');
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
      if (pin1.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
      setPinStep('confirm');
    } else {
      if (pin1 !== pin2) { setPinError('PINs do not match'); setPinStep('enter'); setPin2(''); return; }
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
    if (file.size > MAX_BACKUP_BYTES) { setImportError('This file is too large to be a backup.'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseBackupText(String(ev.target?.result ?? ''));
      if (parsed.ok) setPendingRestore(parsed.backup);
      else setImportError(parsed.error);
    };
    reader.onerror = () => setImportError('The file could not be read.');
    reader.readAsText(file);
  };

  // Step 2: apply after explicit confirmation.
  const handleRestore = (mode: RestoreMode) => {
    if (!pendingRestore) return;
    const before = storage.getEntries().length;
    const result = applyBackup(pendingRestore, mode);
    if (!result.ok) { setPendingRestore(null); setImportError(result.error); return; }
    if (pendingRestore.kind === 'full') reloadWithMessage(`Backup restored: ${result.entryCount} entries plus the habits, goals, challenges and settings it contained.`);
    else if (mode === 'merge') {
      const added = storage.getEntries().length - before;
      reloadWithMessage(`Added ${added} ${added === 1 ? 'entry' : 'entries'} from the file. Entries already on this device were kept.`);
    }
    else reloadWithMessage(`Entries replaced with ${result.entryCount} entries from the file.`);
  };

  const handleClearAll = () => {
    clearAll();
    reloadWithMessage('All ZenFuel data was deleted from this browser.');
  };

  return (
    <AppLayout title="Settings">
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
            <Settings size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
        </div>

        {/* Subscription — future paid plans only, hidden during the Free Beta */}
        {MONETIZATION_UI_ENABLED && (
          <Section title="Subscription" icon={<Crown size={16} />}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  {isPremium ? <Zap size={18} className="text-white" /> : <Crown size={18} className="text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{isPremium ? PLANS[subscription.plan].name : 'Free Plan'}</p>
                    <PlanBadge plan={subscription.plan} size="xs" />
                  </div>
                  {subscription.status === 'trial' && trialDaysLeft !== null && (
                    <p className="text-xs text-violet-500">Trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}</p>
                  )}
                  {isPremium && daysLeft !== null && (
                    <p className="text-xs text-slate-400">Premium access ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
                  )}
                  {isPremium && subscription.plan === 'lifetime' && (
                    <p className="text-xs text-emerald-500">Active forever ✓</p>
                  )}
                  {!isPremium && (
                    <p className="text-xs text-slate-400">3 habits · 30-day history · basic features</p>
                  )}
                </div>
              </div>
              {isPremium ? (
                <Button variant="outline" size="sm" onClick={cancelSubscription}>Downgrade</Button>
              ) : (
                <Link href="/upgrade" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-all">
                  Upgrade →
                </Link>
              )}
            </div>
          </Section>
        )}

        {/* Notifications */}
        <Section title="Notifications" icon={<Bell size={16} />}>
          {notifSupport !== 'supported' ? (
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm text-slate-600 dark:text-slate-300">
              <Bell size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
              {notifSupport === 'install-required'
                ? 'On iPhone and iPad, reminders are only available after adding this app to your Home Screen (Share → Add to Home Screen), then opening it from there.'
                : 'This browser does not support notifications.'}
            </div>
          ) : notifPerms === 'denied' ? (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              Browser notifications are blocked. Reset them in your browser's site settings, then reload.
            </div>
          ) : notifPerms !== 'granted' ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Morning check-ins, evening score summaries and a reminder at a time you choose. Reminders are shown only while this app is open.
              </p>
              <Button size="sm" icon={<Bell size={14} />} onClick={handleEnableNotifications}>
                Enable Notifications
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Row label="Reminders" sub={notifPrefs.enabled ? 'On — scheduled while the app is open' : 'Off'}>
                <Switch checked={notifPrefs.enabled} onChange={v => updateNotifPref({ enabled: v })} label="Reminders" />
              </Row>
              <Row label="Your name (optional)" sub="Used in notification messages">
                <input type="text" value={notifPrefs.userName} onChange={e => updateNotifPref({ userName: e.target.value })} placeholder="e.g. Sam" aria-label="Your name (optional)" className="input w-32 text-sm" maxLength={20} />
              </Row>
              <div className="h-px bg-slate-200 dark:bg-slate-700" />
              <Row label="Morning check-in" sub="Daily reminder to start the day intentionally">
                <div className="flex items-center gap-2">
                  <input type="time" value={notifPrefs.morningTime} onChange={e => updateNotifPref({ morningTime: e.target.value })} disabled={!notifPrefs.morningEnabled} aria-label="Morning check-in time" className="input w-auto text-sm py-1 disabled:opacity-50" />
                  <Switch checked={notifPrefs.morningEnabled} onChange={v => updateNotifPref({ morningEnabled: v })} label="Morning check-in" />
                </div>
              </Row>
              <Row label="Evening summary" sub="Daily score recap at day end">
                <div className="flex items-center gap-2">
                  <input type="time" value={notifPrefs.eveningTime} onChange={e => updateNotifPref({ eveningTime: e.target.value })} disabled={!notifPrefs.eveningEnabled} aria-label="Evening summary time" className="input w-auto text-sm py-1 disabled:opacity-50" />
                  <Switch checked={notifPrefs.eveningEnabled} onChange={v => updateNotifPref({ eveningEnabled: v })} label="Evening summary" />
                </div>
              </Row>
              <Row label="High-risk time reminder" sub="A reminder at a time you choose">
                <div className="flex items-center gap-2">
                  <input type="time" value={notifPrefs.vulnerableTime} onChange={e => updateNotifPref({ vulnerableTime: e.target.value })} disabled={!notifPrefs.vulnerableEnabled} aria-label="High-risk reminder time" className="input w-auto text-sm py-1 disabled:opacity-50" />
                  <Switch checked={notifPrefs.vulnerableEnabled} onChange={v => updateNotifPref({ vulnerableEnabled: v })} label="High-risk time reminder" />
                </div>
              </Row>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" icon={<Bell size={14} />} onClick={handleTestNotification}>Send test notification</Button>
                {testResult && <p role="status" className="text-xs text-slate-500 dark:text-slate-400 flex-1 min-w-[12rem]">{testResult}</p>}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2 leading-relaxed">
                Reminders are shown only while {appName} is open in a browser tab or app window. They are not delivered when it is
                closed, and your browser or phone may delay or silence them (for example in battery-saver mode).
                {hiddenMode && ' Hidden Mode is on, so reminders use neutral wording.'}
              </p>
            </div>
          )}
        </Section>

        <Section title="Appearance" icon={<Sun size={16} />}>
          <Row label="Theme" sub="Choose light or dark mode">
            <div className="flex gap-1">
              {(['light', 'dark'] as const).map(t => (
                <button key={t} onClick={() => setTheme(t)} aria-pressed={theme === t} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${theme === t ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                  {t === 'light' ? <Sun size={12} /> : <Moon size={12} />}{t}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title="Privacy & Security" icon={<Shield size={16} />}>
          <Row label="PIN Lock" sub="Require a 4–6 digit PIN to open the app on this device">
            {pinEnabled
              ? <Button variant="outline" size="sm" icon={<Unlock size={14} />} onClick={disablePin}>Disable PIN</Button>
              : <Button variant="secondary" size="sm" icon={<Lock size={14} />} onClick={() => setPinStep('enter')}>Set PIN</Button>
            }
          </Row>
          {pinStep !== 'idle' && !pinEnabled && (
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
              <label htmlFor="pin-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{pinStep === 'enter' ? 'Enter new PIN (4–6 digits)' : 'Enter the same PIN again'}</label>
              <input id="pin-input" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="off"
                onKeyDown={e => { if (e.key === 'Enter') handleSetPin(); }}
                value={pinStep === 'enter' ? pin1 : pin2}
                onChange={e => pinStep === 'enter' ? setPin1(e.target.value.replace(/\D/g, '')) : setPin2(e.target.value.replace(/\D/g, ''))}
                placeholder="••••" className="input text-center tracking-widest text-lg" />
              {pinError && <p role="alert" className="text-xs text-red-500">{pinError}</p>}
              <p className="text-xs text-slate-500 dark:text-slate-400">If you forget the PIN, the only way back in is to erase this browser&apos;s {appName} data (you can restore a backup afterwards). The PIN hides the app; it does not encrypt your data.</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setPinStep('idle'); setPin1(''); setPin2(''); setPinError(''); }}>Cancel</Button>
                <Button size="sm" onClick={handleSetPin}>{pinStep === 'enter' ? 'Next' : 'Save PIN'}</Button>
              </div>
            </div>
          )}
          {pinEnabled && (
            <Row label="Auto-lock timeout" sub="Lock after inactivity">
              <select value={autoLockMinutes} onChange={e => updateAutoLock(Number(e.target.value))} className="input w-auto text-sm py-1.5">
                {[1, 2, 5, 10, 15, 30, 60].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </Row>
          )}
          <div className="h-px bg-slate-200 dark:bg-slate-700" />
          <Row label="Hidden Mode" sub="Keep the app discreet and hide private details on screen">
            <Switch checked={hiddenMode} onChange={setHiddenMode} label="Hidden Mode" />
          </Row>
          {hiddenMode && (
            <Row label="Neutral title" sub="Shown instead of the app name in the app and the browser tab">
              <input type="text" value={storedHiddenTitle} onChange={e => setHiddenTitle(e.target.value)} aria-label="Neutral title" className="input w-44 text-sm" placeholder={DEFAULT_HIDDEN_TITLE} maxLength={40} />
            </Row>
          )}
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2.5 leading-relaxed space-y-1.5">
            <p className="flex items-start gap-1.5"><EyeOff size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>Hidden Mode replaces the app name and logo with a neutral title, and shows habit names, notes, goals and challenges as placeholders such as &ldquo;Private habit 1&rdquo;. Use <strong>Show</strong> in the header to see details for two minutes.</span>
            </p>
            <p>It only changes what is shown on screen. Your data is not changed or encrypted, and backups and exports contain the real data.</p>
            <p>A website cannot change its web address, your browser history, or the name and icon of an installed app, so those still show the real app name. Pages viewed before the app finishes loading may briefly show the normal title.</p>
          </div>
        </Section>

        <Section title="Data Management" icon={<Download size={16} />}>
          {flash && (
            <div role="status" className="flex items-start gap-2 px-3 py-2 rounded-lg text-sm bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <Check size={14} className="shrink-0 mt-0.5" />
              {flash}
            </div>
          )}
          {hiddenMode && (
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
              Hidden Mode is on. Backups and CSV exports still contain your real habit names and notes.
            </p>
          )}
          <Row label="Full backup (JSON)" sub="Everything needed to restore your data on this or another device">
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportFullBackup}>Export backup</Button>
          </Row>
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs leading-relaxed bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Backup files are not encrypted.</strong> Anyone who opens the file can read your habit logs,
              notes and settings. It also contains a hash of your PIN, which does not reliably protect the PIN.
              Keep backups somewhere private and delete copies you no longer need.
            </span>
          </div>
          <Row label="Entries (CSV)" sub="For spreadsheets. CSV files cannot be imported back.">
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => exportToCSV(entries, habits)}>Export CSV</Button>
          </Row>
          <Row label="Restore from backup" sub="Choose a JSON file made with Export backup. You will be asked to confirm before anything changes.">
            <div>
              <input type="file" accept=".json,application/json" ref={fileRef} onChange={handleImport} className="hidden" />
              <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => fileRef.current?.click()}>Import</Button>
            </div>
          </Row>
          <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2 leading-relaxed">
            Backups include entries, habits, goals, challenges, settings (including your PIN lock), notification
            preferences and any saved plan status. Not included: dismissed alerts and the auto-lock activity timer.
            Browser notification permission is controlled by your browser. Plan status does not change any features
            during the free beta.
          </p>

          {importError && (
            <div ref={importErrorRef} tabIndex={-1} role="alert" className="flex items-start gap-2 px-3 py-2 rounded-lg text-sm bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 outline-none">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{importError} Nothing on this device was changed.</span>
            </div>
          )}

          {pendingRestore && (
            <div ref={restoreRef} tabIndex={-1} role="alertdialog" aria-labelledby="restore-title" className="p-4 rounded-xl border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 space-y-3 text-amber-900 dark:text-amber-200 outline-none scroll-mt-32">
              {pendingRestore.kind === 'full' ? (
                <>
                  <p id="restore-title" className="font-semibold text-sm flex items-center gap-2"><AlertTriangle size={15} className="shrink-0" /> Replace all data with this backup?</p>
                  <ul className="text-xs space-y-1 list-disc ml-5 opacity-90">
                    {pendingRestore.exportedAt && <li>Backup created {new Date(pendingRestore.exportedAt).toLocaleString()}</li>}
                    <li>Backup contains: {describeBackup(pendingRestore.summary)}{dateRange(pendingRestore.summary)}</li>
                    <li>This device now has: {entries.length} entries, {customHabitCount} custom habits, {goals.length} goals, {customChallengeCount} custom challenges</li>
                    {pendingRestore.summary.pinEnabled && <li>This backup has a PIN lock. You will need that PIN to open the app after restoring.</li>}
                  </ul>
                  <p className="text-xs font-semibold">Everything currently stored on this device will be replaced. This cannot be undone.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setPendingRestore(null)}>Cancel</Button>
                    <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportFullBackup}>Back up current data first</Button>
                    <Button variant="danger" size="sm" onClick={() => handleRestore('replace')}>Replace all data</Button>
                  </div>
                </>
              ) : (
                <>
                  <p id="restore-title" className="font-semibold text-sm flex items-center gap-2"><AlertTriangle size={15} className="shrink-0" /> Older export — entries only</p>
                  <ul className="text-xs space-y-1 list-disc ml-5 opacity-90">
                    <li>File contains {pendingRestore.summary.entryCount} entries{dateRange(pendingRestore.summary)}</li>
                    <li>This device now has {entries.length} entries</li>
                    <li>Habits, goals, challenges and settings on this device will not change.</li>
                  </ul>
                  <p className="text-xs"><strong>Add</strong> keeps your current entries and adds the ones from the file that are not already here. <strong>Replace</strong> deletes your current entries and keeps only the file&apos;s entries.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setPendingRestore(null)}>Cancel</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleRestore('merge')}>Add to current entries</Button>
                    <Button variant="danger" size="sm" onClick={() => handleRestore('replace')}>Replace current entries</Button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <Row label="Clear All Data" sub="Delete all of this app's data stored in this browser.">
              <Button variant="outline" size="sm" icon={<Trash2 size={14} />} onClick={() => { setConfirmClear(true); setPendingRestore(null); }} disabled={confirmClear}>Clear All</Button>
            </Row>
            {confirmClear && (
              <div role="alertdialog" aria-labelledby="clear-title" className="mt-3 p-4 rounded-xl border-2 border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 space-y-3 text-red-800 dark:text-red-300">
                <p id="clear-title" className="font-semibold text-sm flex items-center gap-2"><AlertTriangle size={15} className="shrink-0" aria-hidden="true" /> Delete all {appName} data from this browser?</p>
                <ul className="text-xs space-y-1 list-disc ml-5 opacity-90">
                  <li>
                    {entries.length === 0
                      ? 'Entries and their notes (none are stored right now)'
                      : `All ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} and their notes`}
                  </li>
                  <li>Goals, challenges and custom habits</li>
                  <li>Settings, including your PIN lock, Hidden Mode and theme</li>
                  <li>Notification preferences and your optional name</li>
                  <li>Any saved plan status, dismissed alerts and failed-PIN counter</li>
                </ul>
                <p className="text-xs">Default habits and built-in challenges will be set up again. Browser notification permission and Google Analytics cookies are not affected. <strong>This cannot be undone.</strong></p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>Cancel</Button>
                  <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportFullBackup}>Back up first</Button>
                  <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={handleClearAll}>Delete everything</Button>
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title="About" icon={<Brain size={16} />}>
          <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            {[
              ['App', appName],
              ['Version', `${APP_VERSION} (beta)`],
              ['Plan', 'Free during beta'],
              ['Habits tracked', habits.length],
              ['Total events', entries.length],
              ['Tracker data', 'Stored in this browser only'],
              ['Website analytics', 'Google Analytics (usage data)'],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between gap-4">
                <span>{label}</span>
                <span className={`font-medium text-right ${String(value).includes('browser only') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>{value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
