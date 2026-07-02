'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Settings, Shield, Moon, Sun, Lock, Unlock, Download, Upload, Trash2, Check, AlertTriangle, Brain, Crown, Zap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlanBadge } from '@/components/subscription/PlanBadge';
import { storage } from '@/utils/storage';
import { exportToCSV, exportToJSON } from '@/utils/export';
import { PLANS } from '@/utils/subscription';

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
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, entries, habits, importBackup, clearAll, pinEnabled, enablePin, disablePin, autoLockMinutes, updateAutoLock, subscription, isPremium, daysLeft, trialDaysLeft, cancelSubscription, activateDemo } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pinStep, setPinStep] = useState<'idle' | 'enter' | 'confirm'>('idle');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinError, setPinError] = useState('');
  const [hiddenMode, setHiddenModeState] = useState(() => storage.getSettings().hiddenMode);
  const [hiddenTitle, setHiddenTitle] = useState(() => storage.getSettings().hiddenTitle);
  const [confirmClear, setConfirmClear] = useState(false);
  const [importStatus, setImportStatus] = useState('');

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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = importBackup(ev.target?.result as string);
      setImportStatus(result.success ? `Imported ${result.count} events successfully.` : 'Import failed — invalid file.');
      setTimeout(() => setImportStatus(''), 4000);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
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

        {/* Subscription section */}
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
                  <p className="text-xs text-slate-400">Renews in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
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

          {/* Demo activation for testing */}
          {!isPremium && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Developer testing:</p>
              <div className="flex gap-2 flex-wrap">
                {(['monthly', 'yearly', 'lifetime'] as const).map(plan => (
                  <button key={plan} onClick={() => activateDemo(plan)} className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-violet-100 dark:hover:bg-violet-500/20 text-slate-600 dark:text-slate-400 hover:text-violet-700 dark:hover:text-violet-400 rounded-lg transition-colors capitalize">
                    Demo {plan}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Appearance" icon={<Sun size={16} />}>
          <Row label="Theme" sub="Choose light or dark mode">
            <div className="flex gap-1">
              {(['light', 'dark'] as const).map(t => (
                <button key={t} onClick={() => setTheme(t)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${theme === t ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                  {t === 'light' ? <Sun size={12} /> : <Moon size={12} />}{t}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title="Privacy & Security" icon={<Shield size={16} />}>
          <Row label="PIN Lock" sub="Require a PIN to open the app">
            {pinEnabled
              ? <Button variant="outline" size="sm" icon={<Unlock size={14} />} onClick={disablePin}>Disable PIN</Button>
              : <Button variant="secondary" size="sm" icon={<Lock size={14} />} onClick={() => setPinStep('enter')}>Set PIN</Button>
            }
          </Row>
          {pinStep !== 'idle' && !pinEnabled && (
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{pinStep === 'enter' ? 'Enter new PIN (4–6 digits)' : 'Confirm PIN'}</p>
              <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                value={pinStep === 'enter' ? pin1 : pin2}
                onChange={e => pinStep === 'enter' ? setPin1(e.target.value.replace(/\D/g, '')) : setPin2(e.target.value.replace(/\D/g, ''))}
                placeholder="••••" className="input text-center tracking-widest text-lg" />
              {pinError && <p className="text-xs text-red-500">{pinError}</p>}
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
          <Row label="Hidden Mode" sub="Show app with a different title">
            <button onClick={() => { const next = !hiddenMode; setHiddenModeState(next); storage.saveSettings({ hiddenMode: next }); }} className={`w-10 h-6 rounded-full transition-colors ${hiddenMode ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${hiddenMode ? 'translate-x-4' : ''}`} />
            </button>
          </Row>
          {hiddenMode && (
            <Row label="Custom App Title" sub="Displayed instead of 'Dopamine Detox Tracker'">
              <input type="text" value={hiddenTitle} onChange={e => { setHiddenTitle(e.target.value); storage.saveSettings({ hiddenTitle: e.target.value }); }} className="input w-40 text-sm" placeholder="Habit Tracker" />
            </Row>
          )}
        </Section>

        <Section title="Data Management" icon={<Download size={16} />}>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => exportToCSV(entries, habits)} className="justify-center">Export CSV</Button>
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => exportToJSON(entries)} className="justify-center">Export JSON</Button>
          </div>
          <Row label="Import Backup" sub="Restore from a JSON backup file">
            <div>
              <input type="file" accept=".json" ref={fileRef} onChange={handleImport} className="hidden" />
              <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => fileRef.current?.click()}>Import</Button>
            </div>
          </Row>
          {importStatus && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${importStatus.includes('success') ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
              {importStatus.includes('success') ? <Check size={14} /> : <AlertTriangle size={14} />}
              {importStatus}
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <Row label="Clear All Data" sub="Permanently delete all events, goals, and challenges.">
              <Button variant={confirmClear ? 'danger' : 'outline'} size="sm" icon={<Trash2 size={14} />} onClick={() => { if (confirmClear) { clearAll(); setConfirmClear(false); } else setConfirmClear(true); }}>
                {confirmClear ? 'Confirm Clear' : 'Clear All'}
              </Button>
            </Row>
            {confirmClear && (
              <div className="mt-2 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-500">This will delete everything permanently.</p>
                <button className="text-xs text-slate-400 ml-auto" onClick={() => setConfirmClear(false)}>Cancel</button>
              </div>
            )}
          </div>
        </Section>

        <Section title="About" icon={<Brain size={16} />}>
          <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            {[
              ['App', 'Dopamine Detox Tracker'],
              ['Version', '2.0.0'],
              ['Habits tracked', habits.length],
              ['Total events', entries.length],
              ['Storage', 'Local browser only'],
              ['Privacy', 'No server · No tracking · 100% private'],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <span>{label}</span>
                <span className={`font-medium ${String(value).includes('No server') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>{value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
