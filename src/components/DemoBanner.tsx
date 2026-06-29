import Image from 'next/image';
import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';
import { resetDemoAction } from '@/app/demo-actions';
import { TabletIcon, RefreshIcon } from '@/components/icons';

/**
 * Slim "Live Demo" banner shown on every page (sticky, so it stays visible while
 * scrolling): a portfolio label, a "connected to <DB>" badge, a GitHub link, and
 * (for an admin) a one-click "Reset demo" button. Edit the URL below to your own
 * profile before deploying.
 */
const LINKS = {
  github: 'https://github.com/WaranyooChuathon',
};

/**
 * Database badge. To switch the database later, just drop a new logo SVG into
 * `public/` and point `logo` at it (and update `label`) — no other code changes.
 * `unoptimized` is required because Next's image optimizer rejects SVGs by default.
 */
const DB = {
  label: 'เชื่อมต่อกับฐานข้อมูล Neon',
  logo: '/neon_icon/neon-logomark-light-color.svg',
};

export async function DemoBanner() {
  const session = await auth();
  const isAdmin = hasRole(session?.user?.role, ['admin']);

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950 dark:text-amber-300">
      <span className="inline-flex items-center gap-1.5 font-medium">
        {/* green = "live / connected" */}
        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden />
        Live Demo · ข้อมูลตัวอย่างเพื่อการสาธิต
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Image src={DB.logo} alt="" width={14} height={14} unoptimized className="h-3.5 w-3.5" />
        {DB.label}
      </span>
      <a
        href={LINKS.github}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-200"
      >
        GitHub
      </a>
      <a
        href="/showcase"
        // _top so clicking from inside the showcase iframe navigates the whole
        // window (never nests another /showcase frame inside the framed app).
        target="_top"
        className="inline-flex items-center gap-1 underline-offset-2 hover:text-amber-700 dark:hover:text-amber-200"
      >
        <TabletIcon className="h-3.5 w-3.5" />
        <span className="underline underline-offset-2">Tablet view</span>
      </a>
      {isAdmin && (
        <form action={resetDemoAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-full border border-amber-300 px-2 py-0.5 font-medium transition-colors hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/40"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Reset demo
          </button>
        </form>
      )}
    </div>
  );
}
