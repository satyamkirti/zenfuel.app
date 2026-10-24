import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, H2, P, InfoBox, MailLink } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Contact Us — ZenFuel',
  description: 'Get in touch with ZenFuel support. We respond personally to every message.',
};

function ContactCard({
  subject,
  label,
  description,
}: {
  subject: string;
  label: string;
  description?: string;
}) {
  const href = `mailto:zenfuel.support@gmail.com?subject=${encodeURIComponent(subject)}`;
  return (
    <a
      href={href}
      className="flex items-start gap-4 p-4 rounded-2xl border-2 border-line hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-all group"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{label}</p>
        {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
        <p className="text-xs text-muted mt-1">Subject: {subject}</p>
      </div>
      <span className="text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg">→</span>
    </a>
  );
}

export default function ContactPage() {
  return (
    <LegalLayout title="Contact Us" lastUpdated="October 17, 2026">

      <InfoBox>
        <p className="font-semibold text-ink-2 text-base">ZenFuel — Brain Reset</p>
        <p>Operated by Satyam Kumar Kirti</p>
        <p>Email: <MailLink /></p>
        <p>Response time: Within 2–3 business days</p>
      </InfoBox>

      <P>We&apos;re here to help. Reach out for any questions, feedback, or support — we respond personally.</P>

      <H2>What can we help you with?</H2>

      <div className="space-y-3 mb-8">
        <ContactCard
          subject="General Support"
          label="General support"
          description="Questions about using ZenFuel"
        />
        <ContactCard
          subject="Bug Report"
          label="Bug report"
          description="Something isn't working right"
        />
        <ContactCard
          subject="Feature Suggestion"
          label="Feature suggestion"
          description="Ideas to make ZenFuel better"
        />
      </div>

      <H2>About Your Data</H2>
      <P>ZenFuel has no user accounts, and your tracker data is stored locally in your browser — we do not have a copy of it. This means we cannot recover lost data or reset a forgotten PIN for you. To delete or export your data, use Settings → Data Management on your device; see our <Link href="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline">Privacy Policy</Link> for details.</P>

      <H2>Media & Partnership Enquiries</H2>
      <InfoBox>
        <p>Email: <MailLink /></p>
        <p>Subject: &quot;Partnership / Media Enquiry&quot;</p>
      </InfoBox>

      <H2>Privacy Questions</H2>
      <P>For questions about privacy or this website&apos;s use of Google Analytics:</P>
      <InfoBox>
        <p>Email: <MailLink /></p>
        <p>Subject: &quot;Privacy Request&quot;</p>
      </InfoBox>

      <p className="text-sm text-muted mt-8 italic">ZenFuel is operated by Satyam Kumar Kirti, India.</p>

    </LegalLayout>
  );
}
