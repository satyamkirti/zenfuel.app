import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/refund', label: 'Refund Policy' },
  { href: '/contact', label: 'Contact' },
];

interface LegalLayoutProps {
  children: ReactNode;
  title: string;
  lastUpdated?: string;
}

export function LegalLayout({ children, title, lastUpdated = 'July 7, 2026' }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg/85 backdrop-blur-md border-b border-line pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Logo size="sm" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl text-sm font-medium text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to the app
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">{title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span>ZenFuel · Operated by Satyam Kumar Kirti</span>
            <span>zenfuel.support@gmail.com</span>
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>

        {/* Content: a readable column (about 70 characters per line) on a calm surface. */}
        <article className="bg-surface border border-line rounded-2xl shadow-card px-5 py-7 sm:px-10 sm:py-10 [&>*:first-child]:mt-0">
          <div className="max-w-[68ch]">{children}</div>
        </article>
      </main>

      <footer className="border-t border-line py-10">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
          <p className="text-sm text-muted">© 2026 ZenFuel. Operated by Satyam Kumar Kirti.</p>
          <nav aria-label="Legal" className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2">
            {LEGAL_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted hover:text-brand-text transition-colors py-1"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

// ── Shared prose element helpers ───────────────────────────────────────────────

export function Section({ children }: { children: ReactNode }) {
  return <section className="mb-10">{children}</section>;
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-tight text-ink mt-10 mb-3 first:mt-0">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-ink mt-7 mb-2">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-ink-2 leading-7 mb-4 text-[15px] sm:text-base">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc list-outside ml-5 space-y-2 text-ink-2 leading-7 mb-4 text-[15px] sm:text-base marker:text-muted">{children}</ul>;
}

export function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="p-4 sm:p-5 bg-surface-2 border border-line rounded-xl mb-5 text-[15px] text-ink-2 leading-7 space-y-1">
      {children}
    </div>
  );
}

export function MailLink() {
  return (
    <a href="mailto:zenfuel.support@gmail.com" className="text-brand-text underline underline-offset-2 decoration-blue-400/50 hover:decoration-current font-medium">
      zenfuel.support@gmail.com
    </a>
  );
}

export function PricingTable() {
  const rows = [
    ['Premium Monthly', '₹99', 'Every month'],
    ['Premium Yearly', '₹1,100', 'Every year'],
    ['Lifetime', '₹2,999', 'One-time'],
  ];
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border border-line rounded-xl overflow-hidden">
        <thead className="bg-surface-2 text-ink-2">
          <tr>
            {['Plan', 'Price', 'Billing'].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([plan, price, billing]) => (
            <tr key={plan} className="border-t border-line">
              <td className="px-4 py-2.5 text-ink-2 font-medium">{plan}</td>
              <td className="px-4 py-2.5 text-blue-600 dark:text-blue-400 font-bold">{price}</td>
              <td className="px-4 py-2.5 text-muted">{billing}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
