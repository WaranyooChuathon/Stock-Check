'use client';

import { deleteChecklistItemAction } from './actions';

export function DeleteChecklistButton({ id, label }: { id: string; label: string }) {
  return (
    <form
      action={deleteChecklistItemAction}
      onSubmit={(e) => {
        if (!confirm(`ลบ "${label}" ออกถาวร? ประวัติการตรวจของอุปกรณ์นี้จะถูกลบด้วย`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="h-10 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        ลบ
      </button>
    </form>
  );
}
