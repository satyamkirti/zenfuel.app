'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Sidebar } from './Sidebar';
import { BottomNav, TopBar } from './Navbar';
import { PinLock } from '@/components/security/PinLock';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { FloatingActionButton } from '@/components/ui/QuickLogSheet';
import { BrandMark } from '@/components/ui/BrandMark';
import { MotionController } from '@/components/system/MotionController';
import { useT } from '@/i18n/I18nProvider';

// Pages where the quick-log button would only get in the way of the page's own controls.
const NO_FAB = ['/settings', '/upgrade', '/screen-time'];

// A softly breathing mark while stored data is read (a neutral dot in Hidden Mode).
function LoadingScreen({ label }: { label?: string }) {
  const { hiddenMode } = usePrivacy();
  const t = useT();
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        {hiddenMode
          ? <span className="w-4 h-4 rounded-full bg-brand breathe" aria-hidden="true" />
          : <span className="breathe"><BrandMark size={52} /></span>}
        <p className="text-muted text-sm">{label ?? t('common.loading')}</p>
      </div>
    </div>
  );
}

export function AppLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { isLocked, lockReady, unlock, pinLength, isLoaded, clearAll } = useApp();
  const { appName, conceal } = usePrivacy();
  const pathname = usePathname();
  const t = useT();

  // Locking always re-hides private details that were temporarily shown.
  useEffect(() => { if (isLocked) conceal(); }, [isLocked, conceal]);

  const showFab = isLoaded && !NO_FAB.includes(pathname);

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
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-lg focus:bg-brand focus:text-on-brand focus:shadow-glow">
        {t('common.skipToContent')}
      </a>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} />
        {/* Bottom padding (globals.css): the bar's measured height, which already includes Android's
            navigation area, plus the quick-log button and its gap where it is shown, plus breathing space. */}
        <main id="main" className={clsx('flex-1 px-4 pt-4 sm:px-5 lg:px-8 lg:pt-7 lg:pb-24 max-w-[1320px] w-full mx-auto', showFab ? 'pb-[var(--page-pad-fab)]' : 'pb-[var(--page-pad)]')}>
          {/* Each route fades and rises in (keyed by path, so it plays on every navigation). */}
          {isLoaded ? <div key={pathname} className="page-in">{children}</div> : <LoadingScreen />}
        </main>
        <BottomNav />
      </div>

      <MotionController />
      {/* Mounted after data loads so it can find the page's inline quick-log card. */}
      {showFab && <FloatingActionButton />}
    </div>
  );
}
