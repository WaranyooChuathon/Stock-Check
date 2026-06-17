'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addUserAction, type FormState } from './actions';

const fieldClass =
  'h-11 w-full rounded-lg border border-gray-300 px-3 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

export function AddUserForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(addUserAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="username"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            ชื่อผู้ใช้
          </label>
          <input id="username" name="username" required autoComplete="off" className={fieldClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            รหัสผ่าน
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            สิทธิ์
          </label>
          <select id="role" name="role" defaultValue="staff" className={fieldClass}>
            <option value="staff">พนักงาน (staff)</option>
            <option value="admin">ผู้ดูแล (admin)</option>
          </select>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          เพิ่มผู้ใช้แล้ว
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="h-11 self-start rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:opacity-60"
      >
        {isPending ? 'กำลังเพิ่ม…' : 'เพิ่มผู้ใช้'}
      </button>
    </form>
  );
}
