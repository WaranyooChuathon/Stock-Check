import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginForm } from './LoginForm';
import { enterDemo } from './actions';

export default async function LoginPage() {
  // Already signed in → no need to show the login form.
  const session = await auth();
  if (session?.user) redirect('/');

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            StockCheck
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            เข้าสู่ระบบเพื่อจัดการสต็อก
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <form action={enterDemo}>
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
            >
              🚀 เข้าสู่ Live Demo
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            เข้าใช้งานทันทีในฐานะผู้ดูแล (ข้อมูลสมมติ)
          </p>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            <span className="text-xs text-gray-400 dark:text-gray-500">หรือเข้าสู่ระบบเอง</span>
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          </div>

          <LoginForm />

          <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
            บัญชีทดสอบ: admin / admin123 · staff / staff123
          </p>
        </div>

        <a
          href="/showcase"
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
        >
          📱 ดูแบบ Tablet
        </a>
      </div>
    </main>
  );
}
