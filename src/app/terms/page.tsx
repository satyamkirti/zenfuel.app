import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, H2, P, UL, InfoBox, MailLink, PricingTable } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Terms of Service — ZenFuel',
  description: 'ZenFuel Terms of Service — rules for using the ZenFuel brain reset app.',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">

      <H2>1. Acceptance of Terms</H2>
      <P>By accessing or using ZenFuel at zenfuel.app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.</P>

      <H2>2. What ZenFuel Does</H2>
      <P>ZenFuel is a personal wellness tool that helps users:</P>
      <UL>
        <li>Track dopamine-related habits and triggers</li>
        <li>Build daily routines to reduce compulsive digital behaviour</li>
        <li>Monitor progress through a scoring and streak system</li>
      </UL>
      <InfoBox>
        <p className="font-medium text-slate-700 dark:text-slate-300">⚠️ Important</p>
        <p>ZenFuel is a self-help tool. It is not a medical device, therapy service, or clinical treatment. It should not replace professional medical or psychological advice.</p>
      </InfoBox>

      <H2>3. User Accounts</H2>
      <UL>
        <li>You must be at least 13 years old to create an account</li>
        <li>You are responsible for keeping your login credentials secure</li>
        <li>You are responsible for all activity under your account</li>
        <li>You must provide accurate information during registration</li>
        <li>One person may only maintain one account</li>
      </UL>

      <H2>4. Acceptable Use</H2>
      <P>You agree NOT to:</P>
      <UL>
        <li>Use ZenFuel for any unlawful purpose</li>
        <li>Attempt to access other users' data</li>
        <li>Reverse engineer, copy, or redistribute the app</li>
        <li>Upload malicious code or attempt to hack the service</li>
        <li>Use the app in any way that could damage or overburden our servers</li>
        <li>Misrepresent your identity or affiliation</li>
      </UL>

      <H2>5. Premium Subscriptions</H2>
      <P>ZenFuel offers the following paid plans:</P>
      <PricingTable />
      <P>Monthly subscriptions auto-renew each month. Yearly subscriptions auto-renew each year. Lifetime plans are a single one-time payment with no renewals.</P>
      <P>You can cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period.</P>

      <H2>6. Refund Policy</H2>
      <P>Please refer to our full <Link href="/refund" className="text-violet-600 dark:text-violet-400 hover:underline">Refund Policy</Link>.</P>
      <P>Summary: 7-day refund available for Yearly and Lifetime plans. No refund for Monthly plans.</P>

      <H2>7. Intellectual Property</H2>
      <P>All content on ZenFuel — including but not limited to the app design, logo, text, graphics, and code — is owned by Satyam Kumar Kirti and protected by applicable intellectual property laws.</P>
      <P>You may not copy, modify, distribute, or reproduce any part of ZenFuel without prior written permission.</P>

      <H2>8. User Content</H2>
      <P>Any content you submit to ZenFuel (habit descriptions, journal entries, notes) remains your property. By submitting content, you grant us a limited licence to store and display it solely for the purpose of providing the service to you.</P>

      <H2>9. Disclaimer of Warranties</H2>
      <P>ZenFuel is provided "as is" without any warranties, express or implied. We do not guarantee that:</P>
      <UL>
        <li>The app will be error-free or uninterrupted</li>
        <li>The app will achieve specific wellness outcomes for you</li>
        <li>All features will be available at all times</li>
      </UL>

      <H2>10. Limitation of Liability</H2>
      <P>To the maximum extent permitted by law, Satyam Kumar Kirti shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of ZenFuel, including but not limited to loss of data or loss of profits.</P>

      <H2>11. Governing Law</H2>
      <P>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.</P>

      <H2>12. Changes to Terms</H2>
      <P>We may update these Terms from time to time. Continued use of ZenFuel after changes means you accept the updated terms. We will notify you of major changes via email or an in-app notification.</P>

      <H2>13. Contact</H2>
      <InfoBox>
        <p className="font-semibold text-slate-700 dark:text-slate-300">For questions about these Terms:</p>
        <p>Email: <MailLink /></p>
      </InfoBox>

    </LegalLayout>
  );
}
