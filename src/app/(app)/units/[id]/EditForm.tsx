'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { editAction, type EditFormState } from './actions';

interface EditFormProps {
  unitId: string;
  version: number;
  boxSerialNumber: string | null;
  category: string | null;
  model: string | null;
  location: string | null;
  boxLocation: string | null;
  categoryOptions: string[];
}

const fieldClass =
  'h-11 w-full rounded-lg border border-gray-300 px-3 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';
const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

export function EditForm(props: EditFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<EditFormState, FormData>(editAction, {});

  // After a successful edit the version changes; use the returned value so a
  // second consecutive edit doesn't falsely conflict.
  const currentVersion = state.ok && state.version != null ? state.version : props.version;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="unitId" value={props.unitId} />
      <input type="hidden" name="version" value={currentVersion} readOnly />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="boxSerialNumber" className={labelClass}>
          รหัสรอง / asset tag
        </label>
        <input
          id="boxSerialNumber"
          name="boxSerialNumber"
          defaultValue={props.boxSerialNumber ?? ''}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-category" className={labelClass}>
            หมวดสินค้า
          </label>
          <input
            id="edit-category"
            name="category"
            list="edit-category-options"
            defaultValue={props.category ?? ''}
            placeholder="เช่น signage, laptop, tool"
            className={fieldClass}
          />
          <datalist id="edit-category-options">
            {props.categoryOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="model" className={labelClass}>
            ชื่อ/รุ่นสินค้า
          </label>
          <input
            id="model"
            name="model"
            defaultValue={props.model ?? ''}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className={labelClass}>
            ตำแหน่งสินค้า
          </label>
          <input
            id="location"
            name="location"
            defaultValue={props.location ?? ''}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="boxLocation" className={labelClass}>
          ตำแหน่งที่เก็บรอง
        </label>
        <input
          id="boxLocation"
          name="boxLocation"
          defaultValue={props.boxLocation ?? ''}
          placeholder="เช่น คลัง A, สาขา X, ไม่มี"
          className={fieldClass}
        />
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400"
        >
          <p>{state.error}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-1 font-medium text-red-800 underline dark:text-red-300"
          >
            โหลดข้อมูลล่าสุด
          </button>
        </div>
      )}

      {state.ok && (
        <p
          role="status"
          className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-400"
        >
          บันทึกการแก้ไขแล้ว
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-lg border border-gray-300 px-4 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        {isPending ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}
      </button>
    </form>
  );
}
