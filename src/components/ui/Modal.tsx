'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    // Focus the first field (or the dialog itself) so keyboard and screen-reader users land inside.
    const first = panelRef.current?.querySelector<HTMLElement>('input, select, textarea') ?? panelRef.current;
    first?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'Tab' && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return;
        const firstItem = items[0], lastItem = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstItem) { e.preventDefault(); lastItem.focus(); }
        else if (!e.shiftKey && document.activeElement === lastItem) { e.preventDefault(); firstItem.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={clsx(
          'relative w-full max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-slide-up outline-none',
          widths[size]
        )}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-t-2xl">
            <h3 id={titleId} className="font-semibold text-slate-900 dark:text-white">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="btn-ghost p-2 rounded-lg -mr-2">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
