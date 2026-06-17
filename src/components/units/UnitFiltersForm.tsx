import Link from 'next/link';
import type { UnitFilters } from '@/lib/unit-filters';
import {
  UNIT_STATUSES,
  UNIT_STATUS_LABELS,
  VERIFY_STATES,
  VERIFY_STATE_LABELS,
} from '@/types/inventory';

const selectClass =
  'h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

/**
 * Search/filter form. Plain GET form → updates URL search params → the server
 * component re-renders results. No client JS, fully shareable/bookmarkable.
 */
export function UnitFiltersForm({
  filters,
  categoryOptions,
}: {
  filters: UnitFilters;
  categoryOptions: string[];
}) {
  return (
    <form method="get" className="flex flex-col gap-3">
      <div>
        <label htmlFor="q" className="sr-only">
          ค้นหาด้วย S/N
        </label>
        <input
          id="q"
          name="q"
          type="search"
          inputMode="search"
          defaultValue={filters.q ?? ''}
          placeholder="ค้นหา S/N หรือ รหัสรอง…"
          className="h-11 w-full rounded-lg border border-gray-300 px-3 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-gray-500 dark:text-gray-400">
            สถานะ
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? ''}
            className={selectClass}
          >
            <option value="">ทั้งหมด</option>
            {UNIT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {UNIT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="verifyState"
            className="text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            การตรวจ
          </label>
          <select
            id="verifyState"
            name="verifyState"
            defaultValue={filters.verifyState ?? ''}
            className={selectClass}
          >
            <option value="">ทั้งหมด</option>
            {VERIFY_STATES.map((v) => (
              <option key={v} value={v}>
                {VERIFY_STATE_LABELS[v]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="category"
            className="text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            หมวด
          </label>
          <select
            id="category"
            name="category"
            defaultValue={filters.category ?? ''}
            className={selectClass}
          >
            <option value="">ทั้งหมด</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="location"
            className="text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            ตำแหน่ง
          </label>
          <input
            id="location"
            name="location"
            defaultValue={filters.location ?? ''}
            placeholder="ค้นตำแหน่ง"
            className={selectClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="hasBox" className="text-xs font-medium text-gray-500 dark:text-gray-400">
            ที่เก็บรอง
          </label>
          <select
            id="hasBox"
            name="hasBox"
            defaultValue={filters.hasBox ?? ''}
            className={selectClass}
          >
            <option value="">ทั้งหมด</option>
            <option value="yes">มี</option>
            <option value="no">ไม่มี</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="h-11 flex-1 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40 sm:flex-none sm:px-6"
        >
          ค้นหา / กรอง
        </button>
        <Link
          href="/units"
          className="flex h-11 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          ล้าง
        </Link>
      </div>
    </form>
  );
}
