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
}

export function LegalLayout({ children, title }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Logo size="sm" />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Back to ZenFuel
          </Link>
        </div>
      </header>

      {/* Page title band */}
      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">{title}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>ZenFuel · Operated by Satyam Kumar Kirti</span>
            <span>zenfuel.support@gmail.com</span>
            <span>Last updated: July 7, 2026</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 mt-8">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
          <p className="text-sm text-slate-400">© 2026 ZenFuel. Operated by Satyam Kumar Kirti.</p>
          <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2">
            {LEGAL_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
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
    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700 first:mt-0">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-2">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4 text-[15px]">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc list-outside ml-5 space-y-1.5 text-slate-600 dark:text-slate-400 mb-4 text-[15px]">{children}</ul>;
}

export function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 text-[15px] text-slate-600 dark:text-slate-400 space-y-1">
      {children}
    </div>
  );
}

export function MailLink() {
  return (
    <a href="mailto:zenfuel.support@gmail.com" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
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
      <table className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <tr>
            {['Plan', 'Price', 'Billing'].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([plan, price, billing]) => (
            <tr key={plan} className="border-t border-slate-200 dark:border-slate-700">
              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">{plan}</td>
              <td className="px-4 py-2.5 text-violet-600 dark:text-violet-400 font-bold">{price}</td>
              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{billing}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
