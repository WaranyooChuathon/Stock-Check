import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { BackButton } from '@/components/BackButton';
import { ThemeToggle } from '@/components/ThemeToggle';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: proxy.ts already redirects, but guard here too so the
  // session is available for rendering.
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { name, role } = session.user;

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <BackButton />
            <Link href="/" className="font-semibold text-gray-900 dark:text-gray-100">
              StockCheck
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            {name && (
              <span className="hidden text-sm text-gray-600 sm:inline dark:text-gray-400">
                {name}
              </span>
            )}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {role === 'admin' ? 'ผู้ดูแล' : 'พนักงาน'}
            </span>
            <ThemeToggle />
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
