'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, History, Zap, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { Logo } from '@/components/ui/Logo';

const NAV = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/habits', label: 'Habits', icon: Zap },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="flex">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors',
                active
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar({ title }: { title?: string }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* sm size on mobile */}
        <Logo size="sm" />
        {title && title !== 'Dashboard' && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</span>
        )}
      </div>
    </header>
  );
}
