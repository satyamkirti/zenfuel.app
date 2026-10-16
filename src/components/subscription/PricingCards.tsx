'use client';

import { Check, Crown, Zap, Sparkles, Clock } from 'lucide-react';
import { SubscriptionPlan } from '@/types/subscription';
import { PLANS } from '@/utils/subscription';
import { clsx } from 'clsx';

// Paid plans cannot be purchased until server-verified payments exist.
// The plan buttons are intentionally inert and never change the subscription.

interface PricingCardsProps {
  currentPlan: SubscriptionPlan;
  isPremium: boolean;
}

const PLAN_ORDER: SubscriptionPlan[] = ['monthly', 'yearly', 'lifetime'];

const planIcons: Record<SubscriptionPlan, React.ReactNode> = {
  free: null,
  monthly: <Sparkles size={20} className="text-violet-400" />,
  yearly: <Crown size={20} className="text-amber-400" />,
  lifetime: <Zap size={20} className="text-emerald-400" />,
};

export function PricingCards({ currentPlan, isPremium }: PricingCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLAN_ORDER.map(planId => {
        const plan = PLANS[planId];
        const isYearly = planId === 'yearly';
        const isCurrent = currentPlan === planId;

        return (
          <div
            key={planId}
            className={clsx(
              'relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all',
              isYearly
                ? 'border-amber-400 dark:border-amber-500 shadow-xl shadow-amber-500/10 scale-105'
                : 'border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500'
            )}
          >
            {/* Popular/Best Value badge */}
            {plan.badge && (
              <div className={clsx(
                'absolute -top-0 inset-x-0 text-center py-1.5 text-xs font-black tracking-wider text-white',
                isYearly ? 'bg-amber-500' : 'bg-emerald-500'
              )}>
                {plan.badge}
              </div>
            )}

            <div className={clsx('p-6 bg-gradient-to-br text-white', plan.gradient, plan.badge ? 'pt-10' : '')}>
              <div className="flex items-center gap-2 mb-3">
                {planIcons[planId]}
                <h3 className="text-lg font-black">{plan.name}</h3>
              </div>
              <p className="text-white/70 text-xs mb-4">{plan.tagline}</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black">₹{plan.pricing.inr.toLocaleString()}</span>
                <span className="text-white/70 text-sm mb-1.5">
                  {plan.pricing.interval === 'month' ? '/mo' : plan.pricing.interval === 'year' ? '/yr' : ' once'}
                </span>
              </div>
              {plan.pricing.monthlyEquivalentInr && (
                <p className="text-white/70 text-xs mt-1">Just ₹{plan.pricing.monthlyEquivalentInr}/month — billed annually</p>
              )}
              {planId === 'lifetime' && (
                <p className="text-white/70 text-xs mt-1">One-time payment · Never pay again</p>
              )}
              {plan.pricing.savingLabel && (
                <p className="mt-2 inline-block px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">
                  {plan.pricing.savingLabel}
                </p>
              )}
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 p-6">
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-3 text-center text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-xl">
                  ✓ Current Plan
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                >
                  <Clock size={14} /> Coming Soon
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
