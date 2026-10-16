'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Shown when a page throws while rendering. Stored data is not touched.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div role="alert" className="max-w-sm text-center space-y-4">
        <p className="text-5xl" aria-hidden="true">⚠️</p>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This page could not be shown. Your data in this browser was not changed. Try again, or go back to the dashboard.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <button onClick={reset} className="btn-primary px-4 py-2 text-sm">Try again</button>
          <Link href="/" className="btn-ghost px-4 py-2 text-sm border border-slate-300 dark:border-slate-600">Go to dashboard</Link>
        </div>
      </div>
    </main>
  );
}
