'use client';

import { useActionState } from 'react';
import { UNIT_STATUSES, UNIT_STATUS_LABELS, type UnitStatus } from '@/types/inventory';
import { verifyAction, type VerifyFormState } from './actions';

interface VerifyFormProps {
  unitId: string;
  serialNumber: string | null;
  category: string | null;
  status: UnitStatus;
  note: string | null;
  checklist: { id: string; label: string; present: boolean }[];
  /** existing categories for the autocomplete datalist */
  categoryOptions: string[];
}

const fieldClass =
  'h-11 w-full rounded-lg border border-gray-300 px-3 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';
const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

export function VerifyForm(props: VerifyFormProps) {
  const [state, formAction, isPending] = useActionState<VerifyFormState, FormData>(
    verifyAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="unitId" value={props.unitId} />
      <input
        type="hidden"
        name="checklistItemIds"
        value={props.checklist.map((c) => c.id).join(',')}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="serialNumber" className={labelClass}>
          S/N (จริง)
        </label>
        <input
          id="serialNumber"
          name="serialNumber"
          defaultValue={props.serialNumber ?? ''}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className={labelClass}>
          หมวดสินค้า
        </label>
        <input
          id="category"
          name="category"
          list="category-options"
          defaultValue={props.category ?? ''}
          placeholder="เช่น signage, laptop, tool"
          className={fieldClass}
        />
        <datalist id="category-options">
          {props.categoryOptions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className={labelClass}>
          สถานะ
        </label>
        <select id="status" name="status" defaultValue={props.status} className={fieldClass}>
          {UNIT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {UNIT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={labelClass}>รายการตรวจ/อุปกรณ์</legend>
        {props.checklist.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ยังไม่มีรายการตรวจสำหรับหมวดนี้ (เพิ่มได้ที่หน้าตั้งค่า)
          </p>
        )}
        {props.checklist.map((item) => (
          <label
            key={item.id}
            className="flex min-h-11 items-center gap-3 rounded-lg border border-gray-200 px-3 dark:border-gray-700"
          >
            <input
              type="checkbox"
              name={`present:${item.id}`}
              defaultChecked={item.present}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600/40 dark:border-gray-600"
            />
            <span className="text-sm text-gray-800 dark:text-gray-200">{item.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="note" className={labelClass}>
          หมายเหตุ
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          defaultValue={props.note ?? ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400"
        >
          {state.error}
        </p>
      )}

      {state.ok && (
        <div
          role="status"
          className={`rounded-lg px-3 py-2 text-sm ${
            state.verifyState === 'verified'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400'
              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
          }`}
        >
          {state.verifyState === 'verified' ? (
            <p className="font-medium">บันทึกแล้ว — ตรวจผ่าน ไม่มีปัญหา</p>
          ) : (
            <>
              <p className="font-medium">บันทึกแล้ว — พบปัญหา</p>
              <ul className="mt-1 list-inside list-disc">
                {state.reasons?.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-lg bg-blue-600 px-4 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'กำลังบันทึก…' : 'บันทึกผลตรวจยืนยัน'}
      </button>
    </form>
  );
}
