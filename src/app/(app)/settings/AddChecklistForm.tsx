'use client';

import { useActionState, useRef, useEffect } from 'react';
import { addChecklistItemAction, type AddItemState } from './actions';

export function AddChecklistForm() {
  const [state, formAction, isPending] = useActionState<AddItemState, FormData>(
    addChecklistItemAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the input after a successful add.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label htmlFor="label" className="sr-only">
          ชื่ออุปกรณ์ใหม่
        </label>
        <input
          id="label"
          name="label"
          required
          placeholder="เพิ่มอุปกรณ์ เช่น รีโมท, น็อตยึด"
          className="h-11 flex-1 rounded-lg border border-gray-300 px-3 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:opacity-60"
        >
          {isPending ? 'กำลังเพิ่ม…' : 'เพิ่ม'}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
