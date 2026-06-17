'use client';

import { useActionState, useEffect, useRef } from 'react';
import { resetPasswordAction, type FormState } from './actions';

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    resetPasswordAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <label htmlFor={`pw-${userId}`} className="sr-only">
        รหัสผ่านใหม่
      </label>
      <input
        id={`pw-${userId}`}
        name="password"
        type="password"
        placeholder="รหัสผ่านใหม่"
        autoComplete="new-password"
        className="h-10 w-36 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      <button
        type="submit"
        disabled={isPending}
        className="h-10 shrink-0 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        รีเซ็ตรหัส
      </button>
      {state.ok && <span className="text-xs text-green-700 dark:text-green-400">✓</span>}
      {state.error && <span className="text-xs text-red-700 dark:text-red-400">{state.error}</span>}
    </form>
  );
}
