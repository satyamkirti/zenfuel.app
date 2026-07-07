import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';

type LogoSize = 'sm' | 'md' | 'lg';

const WIDTHS: Record<LogoSize, number> = {
  sm: 100,
  md: 140,
  lg: 200,
};

interface LogoProps {
  size?: LogoSize;
  className?: string;
  linked?: boolean;
}

export function Logo({ size = 'md', className, linked = true }: LogoProps) {
  const w = WIDTHS[size];

  const img = (
    <Image
      src="/images/zenfuel-logo.png"
      alt="ZenFuel — Brain Reset"
      width={w}
      height={w}
      priority
      className={clsx('object-contain', className)}
    />
  );

  if (!linked) return img;

  return (
    <Link href="/" aria-label="ZenFuel — Brain Reset" className="inline-flex shrink-0">
      {img}
    </Link>
  );
}
