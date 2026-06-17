import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';
import { resetDemoAction } from '@/app/demo-actions';

/**
 * Slim "Live Demo" banner shown on every page: a portfolio label, links to the
 * source/resume, and (for an admin) a one-click "Reset demo" button. Edit the
 * URLs below to your own profiles before deploying.
 */
const LINKS = {
  github: 'https://github.com/WaranyooChuathon',
  // TODO: set your resume/portfolio URL (e.g. a PDF or personal site).
  resume: 'https://github.com/WaranyooChuathon',
};

export async function DemoBanner() {
  const session = await auth();
  const isAdmin = hasRole(session?.user?.role, ['admin']);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
      <span className="font-medium">🔴 Live Demo · ข้อมูลสมมติ</span>
      <a
        href={LINKS.github}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-200"
      >
        GitHub
      </a>
      <a
        href={LINKS.resume}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-200"
      >
        Resume
      </a>
      {isAdmin && (
        <form action={resetDemoAction}>
          <button
            type="submit"
            className="rounded-full border border-amber-300 px-2 py-0.5 font-medium transition-colors hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/40"
          >
            ↺ Reset demo
          </button>
        </form>
      )}
    </div>
  );
}
