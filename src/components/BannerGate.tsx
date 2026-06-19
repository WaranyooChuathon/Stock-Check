'use client';

import { usePathname } from 'next/navigation';

/**
 * Hides the (server-rendered) DemoBanner on the `/showcase` presentation route,
 * where the framed iframe already shows its own banner. The banner is passed as
 * children so it stays a server component; this gate only decides visibility.
 */
export function BannerGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/showcase')) return null;
  return <>{children}</>;
}
