import { ReactNode } from 'react';
import { IconTile, Tone } from './Card';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** The page's feature icon, shown in a two-tone gradient tile beside the title. */
  icon?: ReactNode;
  /** The feature's colour (see FEATURE_TONE). */
  tone?: Tone;
  /** Small label above the title (for example the product area). */
  eyebrow?: ReactNode;
}

// One title treatment for every app page: the feature's colourful icon, a clear title, one
// supporting line, and actions on the right.
export function PageHeader({ title, description, actions, eyebrow, icon, tone = 'blue' }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 mb-4 lg:mb-7">
      <div className="min-w-0 flex items-start gap-3.5">
        {icon && <IconTile tone={tone} size="lg" solid className="mt-0.5 shadow-glow">{icon}</IconTile>}
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1 text-brand-text">{eyebrow}</p>}
          <h1 className="page-title">{title}</h1>
          {description && <p className="text-sm sm:text-[15px] text-muted mt-1 leading-relaxed max-w-2xl">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
