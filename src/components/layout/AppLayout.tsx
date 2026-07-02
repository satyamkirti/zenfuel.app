'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav, TopBar } from './Navbar';
import { PinLock } from '@/components/security/PinLock';
import { useApp } from '@/context/AppContext';

export function AppLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { isLocked, unlock } = useApp();

  if (isLocked) {
    return <PinLock onUnlock={unlock} />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} />
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
