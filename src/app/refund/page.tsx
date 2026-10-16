import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, H2, P, UL, InfoBox, MailLink } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Refund Policy — ZenFuel',
  description: 'ZenFuel refund policy — paid plans are not yet available and no payments are collected.',
};

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy" lastUpdated="October 17, 2026">

      <H2>No Payments Are Currently Collected</H2>
      <P>ZenFuel paid plans are not available for purchase yet. The plans shown in the app are marked &quot;Coming Soon&quot;, and ZenFuel does not currently take any payment. Because no payments are collected, there is nothing to refund.</P>

      <H2>Free Trial</H2>
      <UL>
        <li>The 7-day free trial requires no payment details.</li>
        <li>It is recorded only in your browser and ends automatically.</li>
        <li>No charge is made when the trial ends.</li>
      </UL>

      <H2>If Paid Plans Are Introduced</H2>
      <P>If paid plans become available, this Refund Policy and our <Link href="/terms" className="text-violet-600 dark:text-violet-400 hover:underline">Terms of Service</Link> will be updated with the applicable refund terms before any payment is taken.</P>

      <H2>Contact</H2>
      <InfoBox>
        <p className="font-semibold text-slate-700 dark:text-slate-300">If you believe you have been charged in connection with ZenFuel, or have any other billing question:</p>
        <p>Email: <MailLink /></p>
      </InfoBox>

    </LegalLayout>
  );
}
