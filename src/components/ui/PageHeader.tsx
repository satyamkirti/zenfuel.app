import { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

// Shared page heading: strong hierarchy, quiet supporting copy and a clear action area.
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-5 mb-1 border-b border-line/80">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2" aria-hidden="true">
          <span className="h-1.5 w-7 rounded-full bg-gradient-to-r from-blue-600 to-teal-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-text">ZenFuel workspace</span>
        </div>
        <h1 className="text-[26px] sm:text-[30px] leading-tight font-bold tracking-[-0.035em] text-ink">{title}</h1>
        {description && <p className="text-sm sm:text-[15px] text-muted mt-1.5 max-w-2xl leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">{actions}</div>}
    </header>
  );
}
