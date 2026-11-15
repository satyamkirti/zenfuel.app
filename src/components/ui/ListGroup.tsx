import { ReactNode } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';
import { IconTile, Tone } from './Card';

/**
 * A titled group of rows in one card, the pattern used by More and Settings: a small section label
 * outside the card, then rows separated by hairlines.
 */
export function ListGroup({ title, description, children, className, id }: { title?: ReactNode; description?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className={className}>
      {title && <h2 id={id} className="px-1 mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</h2>}
      {description && <p className="px-1 -mt-1 mb-2.5 text-sm text-muted leading-relaxed">{description}</p>}
      <div className="card divide-y divide-line overflow-hidden">{children}</div>
    </section>
  );
}

interface ListRowProps {
  icon?: ReactNode;
  tone?: Tone;
  title: ReactNode;
  sub?: ReactNode;
  /** Right-hand content: a switch, a badge or a value. */
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  current?: boolean;
  className?: string;
}

/** One row: icon tile, title and supporting line, and a control or chevron on the right. */
export function ListRow({ icon, tone = 'teal', title, sub, trailing, href, onClick, current, className }: ListRowProps) {
  const body = (
    <>
      {icon && <IconTile tone={tone} size="lg">{icon}</IconTile>}
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-ink leading-snug">{title}</span>
        {sub && <span className="block mt-0.5 text-[13px] text-muted leading-snug">{sub}</span>}
      </span>
      {trailing}
      {(href || onClick) && !trailing && <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden="true" />}
    </>
  );
  const base = clsx('flex items-center gap-3.5 px-4 py-3 min-h-[64px] w-full text-left', className);
  const interactive = 'transition-colors hover:bg-surface-2/70 active:bg-surface-2 focus:outline-none focus-visible:bg-surface-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand';
  if (href) {
    return <Link href={href} aria-current={current ? 'page' : undefined} className={clsx(base, interactive, current && 'bg-brand-soft/60')}>{body}</Link>;
  }
  if (onClick) {
    return <button type="button" onClick={onClick} className={clsx(base, interactive)}>{body}</button>;
  }
  return <div className={base}>{body}</div>;
}
