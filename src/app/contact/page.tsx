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
      className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-all group"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{label}</p>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        <p className="text-xs text-slate-400 mt-1">Subject: {subject}</p>
      </div>
      <span className="text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg">→</span>
    </a>
  );
}

export default function ContactPage() {
  return (
    <LegalLayout title="Contact Us">

      <InfoBox>
        <p className="font-semibold text-slate-700 dark:text-slate-300 text-base">ZenFuel — Brain Reset</p>
        <p>Operated by Satyam Kumar Kirti</p>
        <p>Email: <MailLink /></p>
        <p>Response time: Within 2–3 business days</p>
      </InfoBox>

      <P>We're here to help. Reach out for any questions, feedback, or support — we respond personally.</P>

      <H2>What can we help you with?</H2>

      <div className="space-y-3 mb-8">
        <ContactCard
          subject="General Support"
          label="Account & login issues"
          description="Can't log in, forgotten password, account problems"
        />
        <ContactCard
          subject="Billing Question"
          label="Subscription & billing"
          description="Charges, plan changes, payment issues"
        />
        <ContactCard
          subject="Refund Request — [Your Plan]"
          label="Refund request"
          description="7-day refund available on Yearly and Lifetime plans"
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

      <H2>For Refunds</H2>
      <P>Please email us with:</P>
      <ul className="list-disc list-outside ml-5 space-y-1 text-[15px] text-slate-600 dark:text-slate-400 mb-4">
        <li>Subject: "Refund Request — [Your Plan]"</li>
        <li>Your registered email address</li>
        <li>Reason for refund (optional)</li>
      </ul>
      <P>See our full <Link href="/refund" className="text-violet-600 dark:text-violet-400 hover:underline">Refund Policy</Link>.</P>

      <H2>Media & Partnership Enquiries</H2>
      <InfoBox>
        <p>Email: <MailLink /></p>
        <p>Subject: "Partnership / Media Enquiry"</p>
      </InfoBox>

      <H2>Privacy & Legal Requests</H2>
      <P>For data deletion, data export, or any privacy-related requests:</P>
      <InfoBox>
        <p>Email: <MailLink /></p>
        <p>Subject: "Privacy Request"</p>
        <p>We handle all privacy requests within 30 days as per applicable law.</p>
      </InfoBox>

      <p className="text-sm text-slate-400 mt-8 italic">ZenFuel is operated by Satyam Kumar Kirti, India.</p>

    </LegalLayout>
  );
}
