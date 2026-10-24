'use client';

// Future Premium upgrade page (restored from commit 2f8da66). Not shown while FREE_BETA is on;
// see docs/future-monetization-plan.md before enabling. Pricing buttons are inert until
// server-verified payments exist.

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Crown, Zap, Target, BarChart3, FileText,
  CheckCircle2, Lock, ArrowLeft, Sparkles, TrendingDown, Gift
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PricingCards } from '@/components/subscription/PricingCards';
import { Logo } from '@/components/ui/Logo';

const FREE_FEATURES = [
  { icon: '📊', label: 'Up to 3 habits only' },
  { icon: '📅', label: 'Last 30 days in History & Analytics' },
  { icon: '📈', label: 'Basic charts only' },
];

const PREMIUM_FEATURES = [
  { icon: <Zap size={18} className="text-amber-400" />, label: 'Focus · Discipline · Productivity Scores', desc: 'See exactly where you stand' },
  { icon: <TrendingDown size={18} className="text-red-400" />, label: 'Relapse Prediction', desc: 'Know your risk before it happens' },
  { icon: <BarChart3 size={18} className="text-blue-400" />, label: 'Advanced Analytics Suite', desc: 'Hourly, weekday, comparison charts' },
  { icon: <Target size={18} className="text-emerald-400" />, label: 'Habit Comparison Dashboard', desc: 'Side-by-side habit performance' },
  { icon: <FileText size={18} className="text-indigo-400" />, label: 'Print / PDF Reports', desc: 'Printable reports you can save as PDF' },
  { icon: <Crown size={18} className="text-amber-400" />, label: 'Unlimited Habits & History', desc: 'Track everything, forever' },
];

const COMPARISON_ROWS = [
  { feature: 'Habits', free: 'Up to 3', premium: 'Unlimited' },
  { feature: 'History', free: '30 days', premium: 'All time' },
  { feature: 'Analytics', free: 'Basic', premium: 'Full suite' },
  { feature: 'Focus Score', free: false, premium: true },
  { feature: 'Discipline Score', free: false, premium: true },
  { feature: 'Productivity Score', free: false, premium: true },
  { feature: 'Relapse Prediction', free: false, premium: true },
  { feature: 'PDF Reports', free: false, premium: true },
  { feature: 'Annual Reports', free: false, premium: true },
  { feature: 'Habit Comparison', free: false, premium: true },
  { feature: 'Streak Tracking', free: true, premium: true },
  { feature: 'Heatmap Calendar', free: true, premium: true },
  { feature: 'CSV Export', free: true, premium: true },
  { feature: 'PIN Lock', free: true, premium: true },
];

const FAQS = [
  { q: 'Where is my data stored?', a: 'Your habit logs, goals, challenges and settings are stored locally in your browser on this device. They are not sent to a ZenFuel server. The website does use Google Analytics, which may collect website usage information — see our Privacy Policy.' },
  { q: 'Can I buy Premium now?', a: 'Not yet. Paid plans are coming soon. No payment is collected in the app today.' },
  { q: 'Is there a free trial?', a: 'Yes. You can start a 7-day free trial from this page without entering payment details.' },
  { q: 'What happens to my data if I downgrade?', a: 'All your data is preserved. You simply lose access to premium features — your history remains intact.' },
];

export function PremiumUpgradeView() {
  const { subscription, startTrial, isPremium, analytics, detoxScore } = useApp();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-sm border-b border-line px-4 py-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-ink-2 hover:text-ink transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <Logo size="sm" />
        <div className="flex items-center gap-1.5 text-sm font-bold text-amber-600 dark:text-amber-400">
          <Crown size={15} /> Premium
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-20">

        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Logo size="lg" linked={false} />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 rounded-full text-amber-700 dark:text-amber-400 text-sm font-semibold">
            <Sparkles size={14} /> Premium Subscription
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-ink leading-tight">
            Unlock Your<br />
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Full Potential</span>
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Get Focus, Discipline and Productivity scores, relapse prediction, unlimited tracking and printable reports — everything you need to take control.
          </p>

          {/* Personalized stats */}
          {analytics.lifetimeCount > 0 && (
            <div className="inline-flex items-center gap-6 px-6 py-4 bg-surface border border-line rounded-2xl shadow-sm text-sm">
              <div className="text-center">
                <p className="text-2xl font-black text-ink">{analytics.lifetimeCount}</p>
                <p className="text-xs text-muted">Events tracked</p>
              </div>
              <div className="h-8 w-px bg-line" />
              <div className="text-center">
                <p className="text-2xl font-black" style={{ color: detoxScore.color }}>{detoxScore.score}</p>
                <p className="text-xs text-muted">Detox Score</p>
              </div>
              <div className="h-8 w-px bg-line" />
              <div className="text-center">
                <p className="text-2xl font-black text-ink">{analytics.lifetimeCount > 0 ? '3' : '0'}</p>
                <p className="text-xs text-muted">Habits (free limit)</p>
              </div>
            </div>
          )}
        </div>

        {/* What you're missing */}
        {!isPremium && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-amber-400 text-sm font-bold uppercase tracking-wider mb-3">On your Free plan</p>
                <h2 className="text-2xl font-black mb-4">You're missing out on these powerful features</h2>
                <div className="space-y-2">
                  {FREE_FEATURES.map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                        <Lock size={10} className="text-red-400" />
                      </div>
                      <span className="text-slate-300 text-sm">{f.icon} {f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {PREMIUM_FEATURES.slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">{f.icon}</div>
                    <div>
                      <p className="text-sm font-semibold">{f.label}</p>
                      <p className="text-xs text-muted">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trial CTA */}
        {!isPremium && (
          <div className="text-center">
            <button
              onClick={() => { startTrial(); router.push('/'); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all hover:scale-105"
            >
              <Gift size={16} /> Start 7-Day Free Trial — No Card Required
            </button>
            <p className="text-xs text-muted mt-2">Trial activates instantly · cancels automatically</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div>
          <h2 className="text-2xl font-black text-center text-ink mb-8">
            {isPremium ? 'Your Subscription' : 'Choose Your Plan'}
          </h2>
          <PricingCards currentPlan={subscription.plan} isPremium={isPremium} />
          <p className="text-center text-xs text-muted mt-4">
            Prices in INR · Paid plans are not available for purchase yet · No payment is collected in the app
          </p>
        </div>

        {/* All Premium Features */}
        <div>
          <h2 className="text-2xl font-black text-center text-ink mb-8">Everything Premium Includes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PREMIUM_FEATURES.map((f, i) => (
              <div key={i} className="flex flex-col gap-3 p-4 bg-surface border border-line rounded-xl hover:border-violet-400 dark:hover:border-violet-500 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">{f.icon}</div>
                <div>
                  <p className="font-semibold text-ink text-sm">{f.label}</p>
                  <p className="text-xs text-muted mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div>
          <h2 className="text-2xl font-black text-center text-ink mb-8">Free vs Premium</h2>
          <div className="bg-surface border border-line rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-surface-2 text-xs font-bold uppercase tracking-wider text-muted px-6 py-3 border-b border-line">
              <span>Feature</span>
              <span className="text-center">Free</span>
              <span className="text-center text-violet-600 dark:text-violet-400">Premium</span>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 px-6 py-3 text-sm ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-700/20'} border-b border-line/50 last:border-0`}>
                <span className="text-ink-2 font-medium">{row.feature}</span>
                <span className="text-center">
                  {typeof row.free === 'boolean'
                    ? row.free ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto" /> : <Lock size={14} className="text-slate-300 dark:text-slate-600 mx-auto" />
                    : <span className="text-muted text-xs">{row.free}</span>}
                </span>
                <span className="text-center">
                  {typeof row.premium === 'boolean'
                    ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                    : <span className="text-violet-600 dark:text-violet-400 font-semibold text-xs">{row.premium}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-black text-center text-ink mb-8">Frequently Asked Questions</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="p-5 bg-surface border border-line rounded-xl">
                <p className="font-semibold text-ink text-sm mb-2">{faq.q}</p>
                <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-10 text-center text-white">
          <h2 className="text-3xl font-black mb-3">Start Your Transformation Today</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            {!isPremium && (
              <button
                onClick={() => { startTrial(); router.push('/'); }}
                className="px-8 py-3 bg-white text-violet-700 rounded-xl font-bold hover:bg-violet-50 transition-colors"
              >
                Start Free Trial
              </button>
            )}
            <button
              type="button"
              disabled
              className="px-8 py-3 bg-white/20 border-2 border-white/40 text-white/80 rounded-xl font-bold cursor-not-allowed"
            >
              Paid plans — Coming Soon
            </button>
          </div>
          <p className="text-violet-300/60 text-xs mt-4">
            See our{' '}
            <Link href="/terms" className="underline hover:text-violet-200 transition-colors">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-violet-200 transition-colors">Privacy Policy</Link>
          </p>
        </div>

      </div>
    </div>
  );
}
