'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { purgeExpiredAction, type TrashState } from './actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 rounded-lg bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/40 disabled:opacity-60"
    >
      {pending ? 'กำลังลบ…' : 'ยืนยันล้างที่ครบกำหนด'}
    </button>
  );
}

export function PurgeExpiredButton({ expiredCount }: { expiredCount: number }) {
  const [state, formAction] = useActionState<TrashState, FormData>(purgeExpiredAction, {});
  const [confirming, setConfirming] = useState(false);

  if (expiredCount === 0 && !state.message) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!confirming ? (
        expiredCount > 0 && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="h-10 rounded-lg border border-red-300 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600/40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            ล้างถาวรที่ครบกำหนด ({expiredCount})
          </button>
        )
      ) : (
        <form action={formAction} className="flex items-center gap-2">
          <Submit />
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ยกเลิก
          </button>
        </form>
      )}
      {state.message && (
        <span className="text-sm text-green-700 dark:text-green-400">{state.message}</span>
      )}
      {state.error && (
        <span role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </span>
      )}
    </div>
  );
}
