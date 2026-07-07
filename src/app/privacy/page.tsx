import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, H2, H3, P, UL, InfoBox, MailLink } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy — ZenFuel',
  description: 'ZenFuel Privacy Policy — how we collect, use, and protect your information.',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">

      <H2>1. Introduction</H2>
      <P>ZenFuel ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use zenfuel.app.</P>
      <P>By using ZenFuel, you agree to the collection and use of information as described in this policy.</P>

      <H2>2. Information We Collect</H2>
      <H3>Information you provide</H3>
      <UL>
        <li>Email address (when you create an account)</li>
        <li>Name (optional, when provided during signup)</li>
        <li>Usage preferences and app settings</li>
      </UL>

      <H3>Information collected automatically</H3>
      <UL>
        <li>Dopamine score, streak data, and habit logs you enter</li>
        <li>Device type and browser information</li>
        <li>App usage patterns (pages visited, features used)</li>
        <li>Date and time of access</li>
      </UL>

      <H3>Information we do NOT collect</H3>
      <UL>
        <li>We do not access your phone's other apps or screen time</li>
        <li>We do not read your messages or contacts</li>
        <li>We do not collect payment card details (handled securely by Razorpay)</li>
      </UL>

      <H2>3. How We Use Your Information</H2>
      <P>We use the information we collect to:</P>
      <UL>
        <li>Provide and maintain the ZenFuel service</li>
        <li>Save your progress, streak, and dopamine score</li>
        <li>Send you check-in reminders and progress notifications (only if you enable them)</li>
        <li>Improve the app based on usage patterns</li>
        <li>Respond to your support requests</li>
        <li>Process payments for premium subscriptions</li>
      </UL>

      <H2>4. Data Storage</H2>
      <P>Your app data (streak, score, logs, habits) is stored:</P>
      <UL>
        <li><strong className="text-slate-800 dark:text-slate-200">Locally</strong> on your device when not logged in</li>
        <li><strong className="text-slate-800 dark:text-slate-200">Securely</strong> in our database (Supabase) when you create an account</li>
      </UL>
      <P>We use Supabase (supabase.com) as our database provider. Your data is encrypted at rest and in transit using AES-256 and TLS encryption standards.</P>

      <H2>5. Data Sharing</H2>
      <P>We do not sell, trade, or share your personal information with third parties except:</P>
      <UL>
        <li><strong className="text-slate-800 dark:text-slate-200">Supabase</strong> — database storage (data processor)</li>
        <li><strong className="text-slate-800 dark:text-slate-200">Razorpay</strong> — payment processing (for premium subscriptions)</li>
        <li><strong className="text-slate-800 dark:text-slate-200">Vercel</strong> — app hosting (infrastructure provider)</li>
        <li><strong className="text-slate-800 dark:text-slate-200">Google Analytics</strong> — anonymous usage analytics</li>
        <li><strong className="text-slate-800 dark:text-slate-200">Law enforcement</strong> — only if required by applicable law</li>
      </UL>
      <P>These third parties are only given access to data necessary to perform their services.</P>

      <H2>6. Cookies</H2>
      <P>ZenFuel uses essential cookies to:</P>
      <UL>
        <li>Keep you logged in between sessions</li>
        <li>Remember your app preferences (dark mode, language)</li>
      </UL>
      <P>We use Google Analytics which sets anonymous tracking cookies. You can disable cookies in your browser settings, though this may affect some app functionality.</P>

      <H2>7. Your Rights</H2>
      <P>You have the right to:</P>
      <UL>
        <li><strong className="text-slate-800 dark:text-slate-200">Access</strong> — request a copy of your personal data</li>
        <li><strong className="text-slate-800 dark:text-slate-200">Correction</strong> — update or correct your information</li>
        <li><strong className="text-slate-800 dark:text-slate-200">Deletion</strong> — request deletion of your account and all data</li>
        <li><strong className="text-slate-800 dark:text-slate-200">Portability</strong> — export your data in a readable format</li>
        <li><strong className="text-slate-800 dark:text-slate-200">Opt-out</strong> — unsubscribe from notifications at any time</li>
      </UL>
      <InfoBox>
        <p>To exercise any of these rights, email: <MailLink /></p>
        <p>We will respond within 30 days.</p>
      </InfoBox>

      <H2>8. Data Retention</H2>
      <P>We retain your data for as long as your account is active. If you delete your account, all personal data is permanently deleted within 30 days. Anonymous usage analytics data may be retained longer.</P>

      <H2>9. Children's Privacy</H2>
      <P>ZenFuel is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us at <MailLink />.</P>

      <H2>10. Changes to This Policy</H2>
      <P>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last updated" date at the top of this page. Continued use of the app after changes means you accept the updated policy.</P>

      <H2>11. Contact</H2>
      <InfoBox>
        <p className="font-semibold text-slate-700 dark:text-slate-300">For privacy-related questions or concerns:</p>
        <p>Email: <MailLink /></p>
        <p>Response time: Within 3 business days</p>
      </InfoBox>

    </LegalLayout>
  );
}
