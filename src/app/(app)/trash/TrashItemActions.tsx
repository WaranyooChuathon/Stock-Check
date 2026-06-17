'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { restoreAction, purgeAction, type TrashState } from './actions';

function Submit({ label, pendingLabel, danger }: { label: string; pendingLabel: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  const base =
    'h-10 rounded-lg px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-60';
  const cls = danger
    ? `${base} bg-red-600 text-white hover:bg-red-700 focus:ring-red-600/40`
    : `${base} border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-blue-600/40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800`;
  return (
    <button type="submit" disabled={pending} className={cls}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function TrashItemActions({
  unitId,
  serialNumber,
}: {
  unitId: string;
  serialNumber: string | null;
}) {
  const [restoreState, restoreFormAction] = useActionState<TrashState, FormData>(restoreAction, {});
  const [purgeState, purgeFormAction] = useActionState<TrashState, FormData>(purgeAction, {});
  const [confirming, setConfirming] = useState(false);

  const error = restoreState.error ?? purgeState.error;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <form action={restoreFormAction}>
          <input type="hidden" name="unitId" value={unitId} />
          <Submit label="กู้คืน" pendingLabel="กำลังกู้…" />
        </form>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="h-10 rounded-lg border border-red-300 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600/40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            ลบถาวร
          </button>
        ) : (
          <form action={purgeFormAction} className="flex items-center gap-2">
            <input type="hidden" name="unitId" value={unitId} />
            <span className="text-xs text-red-700 dark:text-red-400">กู้ไม่ได้!</span>
            <Submit label="ยืนยันลบถาวร" pendingLabel="กำลังลบ…" danger />
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              ยกเลิก
            </button>
          </form>
        )}
      </div>
      {error && (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {serialNumber}: {error}
        </span>
      )}
    </div>
  );
}
