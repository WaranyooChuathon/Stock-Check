'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { deleteUnitAction, type DeleteFormState } from './actions';

function ConfirmSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 flex-1 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/40 disabled:opacity-60"
    >
      {pending ? 'กำลังลบ…' : 'ยืนยันลบ'}
    </button>
  );
}

export function DeleteUnitButton({ unitId, serialNumber }: { unitId: string; serialNumber: string | null }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<DeleteFormState, FormData>(deleteUnitAction, {});

  return (
    <section className="rounded-xl border border-red-200 bg-white p-5 dark:border-red-900/60 dark:bg-gray-900">
      <h2 className="text-sm font-medium text-red-700 dark:text-red-400">ลบเครื่อง</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        ย้ายเครื่องนี้ไปถังขยะ (กู้คืนได้ภายใน 30 วัน ก่อนถูกลบถาวร)
      </p>

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex h-11 items-center rounded-lg border border-red-300 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600/40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          ลบเครื่อง
        </button>
      ) : (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-800 dark:text-red-300">
            ยืนยันลบเครื่อง {serialNumber ? <strong>{serialNumber}</strong> : 'นี้'}?
          </p>
          <form action={formAction} className="mt-3 flex items-center gap-2">
            <input type="hidden" name="unitId" value={unitId} />
            <ConfirmSubmit />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              ยกเลิก
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
