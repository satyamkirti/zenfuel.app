import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, H2, P, InfoBox, MailLink } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Refund Policy — ZenFuel',
  description: 'ZenFuel refund policy — ZenFuel is free during its beta and no payments are collected.',
};

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy" lastUpdated="October 17, 2026">

      <H2>ZenFuel Is Free During Beta</H2>
      <P>ZenFuel is currently free during its beta. There are no subscriptions, paid tiers or trials, and ZenFuel does not take any payment. Because no payments are collected, there is nothing to refund.</P>

      <H2>If Paid Plans Are Introduced</H2>
      <P>If paid plans become available, this Refund Policy and our <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</Link> will be updated with the applicable refund terms before any payment is taken.</P>

      <H2>Contact</H2>
      <InfoBox>
        <p className="font-semibold text-ink-2">If you believe you have been charged in connection with ZenFuel, or have any other billing question:</p>
        <p>Email: <MailLink /></p>
      </InfoBox>

    </LegalLayout>
  );
}
