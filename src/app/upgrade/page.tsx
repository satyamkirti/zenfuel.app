'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Crown, Brain, Zap, Target, BarChart3, FileText,
  Shield, CheckCircle2, Lock, ArrowLeft, Sparkles, TrendingDown, Gift
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PricingCards } from '@/components/subscription/PricingCards';
import { SubscriptionPlan } from '@/types/subscription';

const FREE_FEATURES = [
  { icon: '📊', label: 'Up to 3 habits only' },
  { icon: '📅', label: 'Last 30 days history' },
  { icon: '📈', label: 'Basic charts only' },
  { icon: '💡', label: 'Only 3 insights per day' },
  { icon: '📄', label: 'CSV export only' },
];

const PREMIUM_FEATURES = [
  { icon: <Brain size={18} className="text-violet-400" />, label: 'AI Insights Engine', desc: 'Unlimited personalized behavior insights' },
  { icon: <Zap size={18} className="text-amber-400" />, label: 'Focus · Discipline · Productivity Scores', desc: 'See exactly where you stand' },
  { icon: <TrendingDown size={18} className="text-red-400" />, label: 'Relapse Prediction', desc: 'Know your risk before it happens' },
  { icon: <BarChart3 size={18} className="text-blue-400" />, label: 'Advanced Analytics Suite', desc: 'Hourly, weekday, comparison charts' },
  { icon: <Target size={18} className="text-emerald-400" />, label: 'Habit Comparison Dashboard', desc: 'Side-by-side habit performance' },
  { icon: <FileText size={18} className="text-indigo-400" />, label: 'PDF & Excel Reports', desc: 'Professional downloadable reports' },
  { icon: <Crown size={18} className="text-amber-400" />, label: 'Unlimited Habits & History', desc: 'Track everything, forever' },
  { icon: <Shield size={18} className="text-emerald-400" />, label: 'Cloud Backup', desc: 'Never lose your progress data' },
];

const COMPARISON_ROWS = [
  { feature: 'Habits', free: 'Up to 3', premium: 'Unlimited' },
  { feature: 'History', free: '30 days', premium: 'All time' },
  { feature: 'Analytics', free: 'Basic', premium: 'Full suite' },
  { feature: 'Daily Insights', free: '3 max', premium: 'Unlimited AI' },
  { feature: 'Focus Score', free: false, premium: true },
  { feature: 'Discipline Score', free: false, premium: true },
  { feature: 'Productivity Score', free: false, premium: true },
  { feature: 'Relapse Prediction', free: false, premium: true },
  { feature: 'PDF Reports', free: false, premium: true },
  { feature: 'Excel Export', free: false, premium: true },
  { feature: 'Annual Reports', free: false, premium: true },
  { feature: 'Habit Comparison', free: false, premium: true },
  { feature: 'Premium Challenges', free: false, premium: true },
  { feature: 'Cloud Backup', free: false, premium: true },
  { feature: 'Custom Date Range', free: false, premium: true },
  { feature: 'Streak Tracking', free: true, premium: true },
  { feature: 'Heatmap Calendar', free: true, premium: true },
  { feature: 'CSV Export', free: true, premium: true },
  { feature: 'PIN Lock', free: true, premium: true },
];

const FAQS = [
  { q: 'Is my data safe?', a: 'Yes. All data is stored locally in your browser. We never upload your personal habits to any server.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Monthly and yearly plans can be cancelled at any time. You keep access until the period ends.' },
  { q: 'What payment methods are accepted?', a: 'We support UPI, Credit/Debit cards, NetBanking via Razorpay, and international cards via Stripe.' },
  { q: 'Is there a free trial?', a: 'Yes! You can activate a 7-day free trial from Settings → Subscription without entering payment details.' },
  { q: 'What happens to my data if I downgrade?', a: 'All your data is preserved. You simply lose access to premium features — your history remains intact.' },
  { q: 'Is there a student or family discount?', a: 'We offer special pricing for students. Email us with your institution email for a 40% discount.' },
];

export default function UpgradePage() {
  const { subscription, activateDemo, startTrial, isPremium, analytics, detoxScore } = useApp();
  const router = useRouter();

  const handleActivate = (plan: SubscriptionPlan) => {
    activateDemo(plan);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
      {/* Nav */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to app
        </Link>
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-amber-500" />
          <span className="font-bold text-slate-900 dark:text-white text-sm">Dopamine Detox Premium</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-20">

        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 rounded-full text-amber-700 dark:text-amber-400 text-sm font-semibold">
            <Sparkles size={14} /> Premium Subscription
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight">
            Unlock Your<br />
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Full Potential</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Get AI-powered scores, relapse prediction, unlimited tracking and professional reports — everything you need to take control.
          </p>

          {/* Personalized stats */}
          {analytics.lifetimeCount > 0 && (
            <div className="inline-flex items-center gap-6 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm text-sm">
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{analytics.lifetimeCount}</p>
                <p className="text-xs text-slate-400">Events tracked</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <p className="text-2xl font-black" style={{ color: detoxScore.color }}>{detoxScore.score}</p>
                <p className="text-xs text-slate-400">Detox Score</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{analytics.lifetimeCount > 0 ? '3' : '0'}</p>
                <p className="text-xs text-slate-400">Habits (free limit)</p>
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
                      <p className="text-xs text-slate-400">{f.desc}</p>
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
            <p className="text-xs text-slate-400 mt-2">Trial activates instantly · cancels automatically</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div>
          <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-8">
            {isPremium ? 'Your Subscription' : 'Choose Your Plan'}
          </h2>
          <PricingCards onActivate={handleActivate} currentPlan={subscription.plan} isPremium={isPremium} />
          <p className="text-center text-xs text-slate-400 mt-4">
            Prices in INR · GST inclusive · Secure payments via Razorpay & Stripe
          </p>
        </div>

        {/* All Premium Features */}
        <div>
          <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-8">Everything Premium Includes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PREMIUM_FEATURES.map((f, i) => (
              <div key={i} className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-violet-400 dark:hover:border-violet-500 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">{f.icon}</div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{f.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div>
          <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-8">Free vs Premium</h2>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-700/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-6 py-3 border-b border-slate-200 dark:border-slate-700">
              <span>Feature</span>
              <span className="text-center">Free</span>
              <span className="text-center text-violet-600 dark:text-violet-400">Premium</span>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 px-6 py-3 text-sm ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-700/20'} border-b border-slate-100 dark:border-slate-700/50 last:border-0`}>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{row.feature}</span>
                <span className="text-center">
                  {typeof row.free === 'boolean'
                    ? row.free ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto" /> : <Lock size={14} className="text-slate-300 dark:text-slate-600 mx-auto" />
                    : <span className="text-slate-500 text-xs">{row.free}</span>}
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
          <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-8">Frequently Asked Questions</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <p className="font-semibold text-slate-900 dark:text-white text-sm mb-2">{faq.q}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-10 text-center text-white">
          <h2 className="text-3xl font-black mb-3">Start Your Transformation Today</h2>
          <p className="text-violet-200 mb-8 max-w-md mx-auto">Join thousands of users who've taken control of their dopamine habits with Premium.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { startTrial(); router.push('/'); }}
              className="px-8 py-3 bg-white text-violet-700 rounded-xl font-bold hover:bg-violet-50 transition-colors"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => handleActivate('yearly')}
              className="px-8 py-3 bg-white/20 border-2 border-white/40 text-white rounded-xl font-bold hover:bg-white/30 transition-colors"
            >
              Get Yearly Plan — ₹1,999/yr
            </button>
          </div>
          <p className="text-violet-300 text-xs mt-4">30-day money-back guarantee · Cancel anytime</p>
        </div>

      </div>
    </div>
  );
}
