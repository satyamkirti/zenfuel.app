import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-4">
        <p className="text-5xl" aria-hidden="true">🧭</p>
        <h1 className="text-xl font-bold text-ink">Page not found</h1>
        <p className="text-sm text-ink-2">
          This page does not exist. Your data is stored in this browser and has not been affected.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Link href="/" className="btn-primary px-4 py-2 text-sm">Go to dashboard</Link>
          <Link href="/contact" className="btn-ghost px-4 py-2 text-sm border border-line-strong">Contact</Link>
        </div>
      </div>
    </main>
  );
}
