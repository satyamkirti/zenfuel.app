export type SubscriptionPlan = 'free' | 'monthly' | 'yearly' | 'lifetime';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled';
export type PaymentProvider = 'stripe' | 'razorpay' | 'google_play' | 'apple_iap' | 'demo';

export type PremiumFeature =
  | 'UNLIMITED_HABITS'
  | 'UNLIMITED_HISTORY'
  | 'ADVANCED_ANALYTICS'
  | 'AI_INSIGHTS'
  | 'FOCUS_SCORE'
  | 'DISCIPLINE_SCORE'
  | 'PRODUCTIVITY_SCORE'
  | 'PDF_REPORTS'
  | 'EXCEL_EXPORT'
  | 'CLOUD_BACKUP'
  | 'PREMIUM_CHALLENGES'
  | 'RELAPSE_PREDICTION'
  | 'HABIT_COMPARISON'
  | 'ANNUAL_REPORTS'
  | 'YEARLY_CHARTS'
  | 'CUSTOM_DATE_RANGE';

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: number;
  expiresAt: number | null;
  provider: PaymentProvider | null;
  transactionId?: string;
  trialEndsAt?: number;
}

export interface PlanPricing {
  inr: number;
  usd: number;
  interval: 'month' | 'year' | 'once';
  monthlyEquivalentInr?: number;
  savingPercent?: number;
  savingLabel?: string;
}

export interface PlanDefinition {
  id: SubscriptionPlan;
  name: string;
  tagline: string;
  pricing: PlanPricing;
  badge?: string;
  color: string;
  gradient: string;
  features: string[];
  limits: {
    maxHabits: number | 'unlimited';
    historyDays: number | 'unlimited';
    maxInsights: number | 'unlimited';
    maxGoals: number | 'unlimited';
  };
}

export interface PremiumScore {
  score: number;
  label: string;
  color: string;
  breakdown: { label: string; value: number; impact: 'positive' | 'negative' | 'neutral' }[];
}

export interface RelapseRisk {
  level: 'low' | 'medium' | 'high';
  score: number;
  color: string;
  factors: string[];
  recommendation: string;
}
