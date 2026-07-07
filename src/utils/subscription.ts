import { PlanDefinition, PremiumFeature, Subscription, SubscriptionPlan } from '@/types/subscription';

export const PLANS: Record<SubscriptionPlan, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Get started with the basics',
    pricing: { inr: 0, usd: 0, interval: 'month' },
    color: '#64748b',
    gradient: 'from-slate-500 to-slate-600',
    features: [
      'Up to 3 habits',
      'Last 30 days history',
      'Basic streak tracking',
      'Daily activity chart',
      'Monthly trend chart',
      '3 insights per day',
      'CSV export',
      '5 built-in challenges',
    ],
    limits: { maxHabits: 3, historyDays: 30, maxInsights: 3, maxGoals: 3 },
  },
  monthly: {
    id: 'monthly',
    name: 'Premium',
    tagline: 'Full power, month by month',
    pricing: { inr: 99, usd: 1.19, interval: 'month' },
    color: '#8b5cf6',
    gradient: 'from-violet-600 to-purple-700',
    features: [
      'Unlimited habits',
      'Full unlimited history',
      'Advanced analytics suite',
      'AI insights engine',
      'Focus · Discipline · Productivity Scores',
      'Relapse prediction analytics',
      'Habit comparison dashboard',
      'PDF & Excel reports',
      'Annual reports',
      'Premium challenges',
      'Cloud backup',
      'Custom date ranges',
      'Priority support',
    ],
    limits: { maxHabits: 'unlimited', historyDays: 'unlimited', maxInsights: 'unlimited', maxGoals: 'unlimited' },
  },
  yearly: {
    id: 'yearly',
    name: 'Premium Yearly',
    tagline: 'Best for serious commitment',
    badge: '⭐ Most Popular',
    pricing: {
      inr: 1100,
      usd: 13.19,
      interval: 'year',
      monthlyEquivalentInr: 91.6,
      savingLabel: 'Save ₹88 vs monthly',
    },
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    features: [
      'Everything in Monthly',
      'Just ₹91.6/month billed yearly',
      'Save ₹88 vs paying monthly',
      'Priority feature access',
    ],
    limits: { maxHabits: 'unlimited', historyDays: 'unlimited', maxInsights: 'unlimited', maxGoals: 'unlimited' },
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    tagline: 'One-time payment, never pay again',
    badge: '⚡ Best Value',
    pricing: {
      inr: 2999,
      usd: 35.99,
      interval: 'once',
      savingLabel: 'Best Value',
    },
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      'Everything in Premium',
      'One-time payment — never pay again',
      'No recurring charges, ever',
      'All future features included',
      'Lifetime priority support',
    ],
    limits: { maxHabits: 'unlimited', historyDays: 'unlimited', maxInsights: 'unlimited', maxGoals: 'unlimited' },
  },
};

// All features require premium
const PREMIUM_FEATURES = new Set<PremiumFeature>([
  'UNLIMITED_HABITS', 'UNLIMITED_HISTORY', 'ADVANCED_ANALYTICS', 'AI_INSIGHTS',
  'FOCUS_SCORE', 'DISCIPLINE_SCORE', 'PRODUCTIVITY_SCORE', 'PDF_REPORTS',
  'EXCEL_EXPORT', 'CLOUD_BACKUP', 'PREMIUM_CHALLENGES', 'RELAPSE_PREDICTION',
  'HABIT_COMPARISON', 'ANNUAL_REPORTS', 'YEARLY_CHARTS', 'CUSTOM_DATE_RANGE',
]);

export function isPremium(sub: Subscription): boolean {
  if (sub.plan === 'free') return false;
  if (sub.plan === 'lifetime') return sub.status === 'active';
  if (sub.status === 'trial') return (sub.trialEndsAt ?? 0) > Date.now();
  if (sub.status === 'active') return sub.expiresAt === null || sub.expiresAt > Date.now();
  return false;
}

export function canUseFeature(sub: Subscription, feature: PremiumFeature): boolean {
  if (!PREMIUM_FEATURES.has(feature)) return true;
  return isPremium(sub);
}

export function getFreeLimit(sub: Subscription, limit: keyof PlanDefinition['limits']): number | 'unlimited' {
  if (isPremium(sub)) return 'unlimited';
  return PLANS.free.limits[limit];
}

export function getHistoryCutoff(sub: Subscription): Date | null {
  if (isPremium(sub)) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}

export const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: 'free',
  status: 'active',
  startedAt: Date.now(),
  expiresAt: null,
  provider: null,
};

const SUB_KEY = 'ddt_subscription';

export function loadSubscription(): Subscription {
  if (typeof window === 'undefined') return DEFAULT_SUBSCRIPTION;
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (!raw) return DEFAULT_SUBSCRIPTION;
    const stored = JSON.parse(raw) as Subscription;
    // Auto-expire
    if (stored.plan !== 'lifetime' && stored.expiresAt && stored.expiresAt < Date.now()) {
      return { ...DEFAULT_SUBSCRIPTION };
    }
    return stored;
  } catch {
    return DEFAULT_SUBSCRIPTION;
  }
}

export function saveSubscription(sub: Subscription): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUB_KEY, JSON.stringify(sub));
}

export function activateDemoPremium(plan: SubscriptionPlan = 'yearly'): Subscription {
  const durationMs = plan === 'monthly' ? 30 * 86400000 : plan === 'yearly' ? 365 * 86400000 : null;
  const sub: Subscription = {
    plan,
    status: 'active',
    startedAt: Date.now(),
    expiresAt: durationMs ? Date.now() + durationMs : null,
    provider: 'demo',
    transactionId: `demo_${Date.now()}`,
  };
  saveSubscription(sub);
  return sub;
}

export function activateTrial(): Subscription {
  const sub: Subscription = {
    plan: 'monthly',
    status: 'trial',
    startedAt: Date.now(),
    expiresAt: null,
    provider: 'demo',
    trialEndsAt: Date.now() + 7 * 86400000,
  };
  saveSubscription(sub);
  return sub;
}

export function cancelSubscription(): Subscription {
  const sub = { ...DEFAULT_SUBSCRIPTION };
  saveSubscription(sub);
  return sub;
}
