import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { PremiumUpgradeView } from '@/components/subscription/PremiumUpgradeView';
import { MONETIZATION_UI_ENABLED } from '@/utils/subscription';

export const metadata: Metadata = MONETIZATION_UI_ENABLED
  ? { title: 'Premium', description: 'ZenFuel Premium plans.' }
  : { title: 'Free Beta', description: 'ZenFuel is free during its beta. Every feature in the app is available to everyone, with no subscription or payment.' };

// Only features that exist in the app today.
const INCLUDED = [
  'Detox Score, streaks and activity heatmap',
  'Focus, Discipline and Productivity scores, plus relapse risk',
  'Full history with search, edit and delete — no time limit',
  'Analytics: daily, weekly, monthly, weekday, hourly, yearly and habit comparison charts',
  'Monthly, quarterly and annual reports, with CSV and JSON export and print / PDF',
  'Custom habits, goals and challenges',
  'PIN lock',
];

export default function UpgradePage() {
  // The paid-plan page is kept for the future but never rendered during the Free Beta.
  return MONETIZATION_UI_ENABLED ? <PremiumUpgradeView /> : <FreeBetaInfo />;
}

function FreeBetaInfo() {
  return (
    <AppLayout title="Free Beta">
      <div className="space-y-4 max-w-2xl">
        <div className="rounded-2xl border border-line bg-surface shadow-card p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600/10 text-brand-text px-2.5 py-1 text-xs font-semibold">
            <Sparkles size={13} aria-hidden="true" /> Free beta
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-ink">ZenFuel is free during beta</h1>
          <p className="mt-2 text-sm text-ink-2 leading-relaxed max-w-xl">Everything in the app works for everyone while ZenFuel is in beta. There is nothing to buy.</p>
        </div>

        <Card>
          <p className="text-sm text-ink-2 leading-relaxed">
            Every feature currently in ZenFuel is available to everyone at no cost. There is no
            subscription, no trial and nothing to buy, and you never need to enter payment details.
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold text-ink mb-3">Included for everyone</h2>
          <ul className="space-y-2.5">
            {INCLUDED.map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink-2">
                <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <p className="text-sm text-ink-2 leading-relaxed">
            Your tracker data is stored locally in this browser. See our{' '}
            <Link href="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline">Privacy Policy</Link>{' '}
            for details. If this ever changes, we will update our{' '}
            <Link href="/terms" className="text-violet-600 dark:text-violet-400 hover:underline">Terms of Service</Link>{' '}
            and Privacy Policy before any payment is introduced.
          </p>
        </Card>

        <Link href="/" className="inline-flex px-4 py-2 btn-primary text-sm">
          Go to Dashboard
        </Link>
      </div>
    </AppLayout>
  );
}
