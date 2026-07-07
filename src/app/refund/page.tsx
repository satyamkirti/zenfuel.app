import type { Metadata } from 'next';
import { LegalLayout, H2, P, UL, InfoBox, MailLink } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Refund Policy — ZenFuel',
  description: 'ZenFuel refund policy — 7-day full refund on Yearly and Lifetime plans.',
};

function PlanRefundCard({
  plan,
  price,
  policy,
  eligible,
  steps,
}: {
  plan: string;
  price: string;
  policy: string;
  eligible: boolean;
  steps?: string[];
}) {
  return (
    <div className={`rounded-2xl border-2 p-5 mb-6 ${eligible ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'}`}>
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{plan}</p>
          <p className="text-sm text-violet-600 dark:text-violet-400 font-semibold">{price}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${eligible ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
          {policy}
        </span>
      </div>
      {steps && (
        <ol className="list-decimal list-outside ml-4 space-y-1 text-[14px] text-slate-600 dark:text-slate-400">
          {steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}
      {!eligible && (
        <p className="text-sm text-slate-500 dark:text-slate-400">You can cancel at any time from account settings. Access continues until the end of the billing period.</p>
      )}
    </div>
  );
}

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy">

      <P>We want you to be completely satisfied with ZenFuel Premium. If you are not happy with your purchase, here is our refund policy:</P>

      <H2>Monthly Plan — ₹99/month</H2>
      <PlanRefundCard
        plan="Premium Monthly"
        price="₹99/month"
        policy="No refunds"
        eligible={false}
      />
      <P>Due to the short nature of monthly billing cycles, we are unable to offer refunds on monthly subscriptions.</P>

      <H2>Yearly Plan — ₹1,100/year</H2>
      <PlanRefundCard
        plan="Premium Yearly"
        price="₹1,100/year"
        policy="7-day full refund"
        eligible={true}
        steps={[
          'Email zenfuel.support@gmail.com',
          'Subject line: "Refund Request — Yearly Plan"',
          'Include your registered email address',
          'We will process the refund within 5–7 business days',
        ]}
      />
      <P>After 7 days from purchase, no refund is available for yearly plans.</P>

      <H2>Lifetime Plan — ₹2,999 one-time</H2>
      <PlanRefundCard
        plan="Lifetime"
        price="₹2,999 one-time"
        policy="7-day full refund"
        eligible={true}
        steps={[
          'Email zenfuel.support@gmail.com',
          'Subject line: "Refund Request — Lifetime Plan"',
          'Include your registered email address',
          'We will process the refund within 5–7 business days',
        ]}
      />
      <P>After 7 days from purchase, no refund is available for lifetime plans.</P>

      <H2>How Refunds Are Processed</H2>
      <UL>
        <li>Refunds are returned to the original payment method</li>
        <li>Processing time: 5–7 business days after approval</li>
        <li>You will receive an email confirmation once the refund is processed</li>
        <li>Refunds are subject to any applicable bank processing times</li>
      </UL>

      <H2>Exceptions</H2>
      <P>We may deny a refund if:</P>
      <UL>
        <li>The request is made after the 7-day window</li>
        <li>We detect abuse of the refund policy (multiple refund requests)</li>
        <li>The account violated our Terms of Service</li>
      </UL>

      <H2>Contact</H2>
      <InfoBox>
        <p className="font-semibold text-slate-700 dark:text-slate-300">To request a refund or for any billing questions:</p>
        <p>Email: <MailLink /></p>
        <p>Subject: Refund Request — [Your Plan Name]</p>
        <p>Response time: Within 2 business days</p>
      </InfoBox>

    </LegalLayout>
  );
}
