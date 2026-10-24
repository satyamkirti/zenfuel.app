import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, H2, P, UL, InfoBox, MailLink } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Terms of Service — ZenFuel',
  description: 'ZenFuel Terms of Service — rules for using the ZenFuel brain reset app.',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="October 17, 2026">

      <H2>1. Acceptance of Terms</H2>
      <P>By accessing or using ZenFuel at zenfuel.app, you agree to these Terms of Service. If you do not agree, please do not use the app.</P>

      <H2>2. What ZenFuel Does</H2>
      <P>ZenFuel is a personal self-help tool that runs in your web browser and helps you:</P>
      <UL>
        <li>Log dopamine-related habits and triggers</li>
        <li>Set goals and take on challenges to reduce compulsive behaviour</li>
        <li>Review your progress through scores, streaks and charts</li>
      </UL>
      <InfoBox>
        <p className="font-medium text-ink-2">⚠️ Important</p>
        <p>ZenFuel is a self-help tool. It is not a medical device, therapy service, or clinical treatment, and its scores and risk alerts are estimates based on the data you enter. It should not replace professional medical or psychological advice.</p>
      </InfoBox>

      <H2>3. No Accounts — Your Data Stays on Your Device</H2>
      <UL>
        <li>ZenFuel does not currently offer user accounts. You do not need to sign up to use it.</li>
        <li>Your tracker data is stored locally in your browser on your device, not on a ZenFuel server. See our <Link href="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline">Privacy Policy</Link> for details, including our use of Google Analytics.</li>
        <li>Because we do not hold a copy of your data, we cannot restore it if it is lost — for example, if you clear your browser data, change device or browser, or forget your PIN. You are responsible for exporting any data you want to keep.</li>
        <li>You are responsible for the security of the device and browser you use ZenFuel on.</li>
      </UL>

      <H2>4. Acceptable Use</H2>
      <P>You agree NOT to:</P>
      <UL>
        <li>Use ZenFuel for any unlawful purpose</li>
        <li>Reverse engineer, copy, or redistribute the app</li>
        <li>Attempt to disrupt, overload, or interfere with the website</li>
        <li>Misrepresent your identity or affiliation when contacting us</li>
      </UL>

      <H2>5. Free Beta</H2>
      <UL>
        <li>ZenFuel is <strong className="text-ink">free during its beta</strong>. All features available in the app can be used at no cost.</li>
        <li>There are no subscriptions, paid tiers or trials, and ZenFuel does not collect any payments.</li>
        <li>If paid plans are introduced in the future, these Terms will be updated with pricing, billing, cancellation and refund terms before any payment is taken.</li>
      </UL>

      <H2>6. Intellectual Property</H2>
      <P>All content on ZenFuel — including but not limited to the app design, logo, text, graphics, and code — is owned by Satyam Kumar Kirti and protected by applicable intellectual property laws.</P>
      <P>You may not copy, modify, distribute, or reproduce any part of ZenFuel without prior written permission.</P>

      <H2>7. Your Content</H2>
      <P>Anything you enter into ZenFuel (habit logs, notes, goals, challenges) remains yours. It is stored on your device and is not sent to us.</P>

      <H2>8. Disclaimer of Warranties</H2>
      <P>ZenFuel is provided &quot;as is&quot; without any warranties, express or implied. We do not guarantee that:</P>
      <UL>
        <li>The app will be error-free or uninterrupted</li>
        <li>The app will achieve specific wellness outcomes for you</li>
        <li>All features will be available at all times</li>
      </UL>

      <H2>9. Limitation of Liability</H2>
      <P>To the maximum extent permitted by law, Satyam Kumar Kirti shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of ZenFuel, including but not limited to loss of data stored on your device.</P>

      <H2>10. Governing Law</H2>
      <P>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.</P>

      <H2>11. Changes to Terms</H2>
      <P>We may update these Terms from time to time. When we do, we will update the &quot;Last updated&quot; date at the top of this page. Continued use of ZenFuel after changes means you accept the updated Terms.</P>

      <H2>12. Contact</H2>
      <InfoBox>
        <p className="font-semibold text-ink-2">For questions about these Terms:</p>
        <p>Email: <MailLink /></p>
      </InfoBox>

    </LegalLayout>
  );
}
