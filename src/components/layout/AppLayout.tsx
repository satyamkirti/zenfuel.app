'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { BottomNav, TopBar } from './Navbar';
import { PinLock } from '@/components/security/PinLock';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { FloatingActionButton } from '@/components/ui/QuickLogSheet';

// Pages where the quick-log button would only get in the way of the page's own controls.
const NO_FAB = ['/settings', '/upgrade'];

function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" aria-hidden="true" />
        <p className="text-muted text-sm">{label}</p>
      </div>
    </div>
  );
}

export function AppLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { isLocked, lockReady, unlock, pinLength, isLoaded, clearAll } = useApp();
  const { appName, conceal } = usePrivacy();
  const pathname = usePathname();

  // Locking always re-hides private details that were temporarily shown.
  useEffect(() => { if (isLocked) conceal(); }, [isLocked, conceal]);

  // Nothing protected renders until the saved PIN setting has been checked.
  if (!lockReady) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingScreen /></div>;
  }

  if (isLocked) {
    return (
      <PinLock
        onUnlock={unlock}
        pinLength={pinLength}
        appName={appName}
        onReset={() => { clearAll(); window.location.assign('/'); }}
      />
    );
  }

  return (
    <div className="flex min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-lg focus:bg-violet-600 focus:text-white">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} />
        {/* Bottom padding keeps the last controls clear of the bottom nav, the quick-log button and the home indicator. */}
        <main id="main" className="flex-1 p-4 lg:p-6 pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-24 max-w-7xl w-full mx-auto">
          {isLoaded ? children : <LoadingScreen />}
        </main>
        <BottomNav />
      </div>

      {/* Mounted after data loads so it can find the page's inline quick-log card. */}
      {isLoaded && !NO_FAB.includes(pathname) && <FloatingActionButton />}
    </div>
  );
}
