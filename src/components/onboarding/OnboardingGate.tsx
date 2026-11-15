'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import { Onboarding } from './Onboarding';

// Information pages stay reachable before setup is finished (linked from the stores and site).
const OPEN_PATHS = ['/privacy', '/terms', '/refund', '/contact'];

/** Shows first-launch setup to new installs; everyone else goes straight to the app. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { needsOnboarding } = useI18n();
  const pathname = usePathname();
  if (needsOnboarding && !OPEN_PATHS.includes(pathname)) return <Onboarding />;
  return <>{children}</>;
}
