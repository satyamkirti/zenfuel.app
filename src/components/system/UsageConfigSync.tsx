'use client';

import { useApp } from '@/context/AppContext';
import { useUsageConfigSync } from '@/hooks/useScreenTime';

// Android app only: keeps the native background refresh and limit alerts in step with the
// screen-time settings and Hidden Mode. Does nothing on the website.
export function UsageConfigSync() {
  const { isLoaded } = useApp();
  useUsageConfigSync(isLoaded);
  return null;
}
