'use client';

import { usePathname, useRouter } from 'next/navigation';

/** Visible "back" button for desktop users (browser back is awkward on laptops). Hidden on home. */
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/') return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="ย้อนกลับ"
      className="flex h-10 items-center gap-1 rounded-lg border border-gray-300 px-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      <span aria-hidden="true">←</span>
      <span className="hidden sm:inline">ย้อนกลับ</span>
    </button>
  );
}
