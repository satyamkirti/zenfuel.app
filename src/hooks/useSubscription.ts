'use client';

import { useState, useEffect, useCallback } from 'react';
import { Subscription, SubscriptionPlan, PremiumFeature } from '@/types/subscription';
import {
  loadSubscription, saveSubscription, hasFullAccess, canUseFeature,
  activateDemoPremium, activateTrial, cancelSubscription, getHistoryCutoff, DEFAULT_SUBSCRIPTION,
  getEffectiveSubscription, isLegacyDemoGrant,
} from '@/utils/subscription';

export function useSubscription() {
  // `stored` mirrors localStorage exactly; everything below works from the effective subscription.
  const [stored, setSubscription] = useState<Subscription>(DEFAULT_SUBSCRIPTION);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSubscription(loadSubscription());
    setIsLoaded(true);
  }, []);

  const subscription = getEffectiveSubscription(stored);
  const legacyDemoEnded = isLegacyDemoGrant(stored);

  // True for every user during the Free Beta (see FREE_BETA), regardless of the stored record.
  const premium = hasFullAccess(subscription);

  const checkFeature = useCallback((feature: PremiumFeature): boolean => {
    return canUseFeature(subscription, feature);
  }, [subscription]);

  const historyCutoff = getHistoryCutoff(subscription);

  const activateDemo = useCallback((plan: SubscriptionPlan = 'yearly') => {
    const sub = activateDemoPremium(plan);
    setSubscription(sub);
  }, []);

  const startTrial = useCallback(() => {
    const sub = activateTrial();
    setSubscription(sub);
  }, []);

  const cancel = useCallback(() => {
    const sub = cancelSubscription();
    setSubscription(sub);
  }, []);

  const restore = useCallback((sub: Subscription) => {
    saveSubscription(sub);
    setSubscription(sub);
  }, []);

  const daysLeft = (() => {
    if (!subscription.expiresAt) return null;
    return Math.max(0, Math.ceil((subscription.expiresAt - Date.now()) / 86400000));
  })();

  const trialDaysLeft = (() => {
    if (subscription.status !== 'trial' || !subscription.trialEndsAt) return null;
    return Math.max(0, Math.ceil((subscription.trialEndsAt - Date.now()) / 86400000));
  })();

  return {
    subscription,
    legacyDemoEnded,
    isPremium: premium,
    isLoaded,
    checkFeature,
    historyCutoff,
    daysLeft,
    trialDaysLeft,
    activateDemo,
    startTrial,
    cancel,
    restore,
  };
}
