import { clsx } from 'clsx';

// The approved ZenFuel app icon: the white clock-and-leaf symbol on the blue tile. This shows the
// original artwork file itself (public/images/zenfuel-app-icon.svg), never a redrawn copy.
export const APP_ICON_SRC = '/images/zenfuel-app-icon.svg';

interface BrandMarkProps {
  size?: number;
  /** Kept for compatibility; the approved icon is a self-contained tile on any background. */
  tone?: 'auto' | 'onDark' | 'onBrand';
  className?: string;
}

export function BrandMark({ size = 32, className }: BrandMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG, identical in the web and Android builds
    <img
      src={APP_ICON_SRC}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className={clsx('shrink-0 select-none', className)}
    />
  );
}
