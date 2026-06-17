'use client';

import { useActionState } from 'react';
import { authenticate } from './actions';

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          ชื่อผู้ใช้
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          autoFocus
          aria-describedby={errorMessage ? 'login-error' : undefined}
          className="h-11 rounded-lg border border-gray-300 px-3 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          รหัสผ่าน
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={errorMessage ? 'login-error' : undefined}
          className="h-11 rounded-lg border border-gray-300 px-3 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>

      {errorMessage && (
        <p
          id="login-error"
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 h-11 rounded-lg bg-blue-600 px-4 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
      </button>
    </form>
  );
}
