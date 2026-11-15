import type { Metadata } from 'next';
import { PremiumUpgradeView } from '@/components/subscription/PremiumUpgradeView';
import { FreeBetaInfo } from '@/components/subscription/FreeBetaInfo';
import { MONETIZATION_UI_ENABLED } from '@/utils/subscription';

export const metadata: Metadata = MONETIZATION_UI_ENABLED
  ? { title: 'Premium', description: 'ZenFuel Premium plans.' }
  : { title: 'Free Beta', description: 'ZenFuel is free during its beta. Every feature in the app is available to everyone, with no subscription or payment.' };

export default function UpgradePage() {
  // The paid-plan page is kept for the future but never rendered during the Free Beta.
  return MONETIZATION_UI_ENABLED ? <PremiumUpgradeView /> : <FreeBetaInfo />;
}
