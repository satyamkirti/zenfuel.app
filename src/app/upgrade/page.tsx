import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Free Beta',
  description: 'ZenFuel is free during its beta. Every feature in the app is available to everyone, with no subscription or payment.',
};

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

export default function FreeBetaPage() {
  return (
    <AppLayout title="Free Beta">
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
            <Sparkles size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">ZenFuel is free during beta</h1>
        </div>

        <Card>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Every feature currently in ZenFuel is available to everyone at no cost. There is no
            subscription, no trial and nothing to buy, and you never need to enter payment details.
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Included for everyone</h2>
          <ul className="space-y-2.5">
            {INCLUDED.map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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
