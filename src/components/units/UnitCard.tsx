import Link from 'next/link';
import type { UnitListItem } from '@/server/units';
import type { UnitStatus, VerifyState } from '@/types/inventory';
import { StatusBadge } from './StatusBadge';
import { VerifyStateBadge } from './VerifyStateBadge';
import { MapPinIcon } from '@/components/icons';

export function UnitCard({ unit }: { unit: UnitListItem }) {
  return (
    <Link
      href={`/units/${unit.id}`}
      className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900 dark:text-gray-100">
            {unit.serialNumber ? (
              <span className="font-mono">{unit.serialNumber}</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">ยังไม่มี S/N</span>
            )}
          </p>
          {unit.boxSerialNumber && (
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
              รหัสรอง: <span className="font-mono">{unit.boxSerialNumber}</span>
            </p>
          )}
        </div>
        <VerifyStateBadge state={unit.verifyState as VerifyState} />
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-3 text-xs text-gray-600 dark:text-gray-400">
        <StatusBadge status={unit.status as UnitStatus} />
        {unit.category && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {unit.category}
          </span>
        )}
        {unit.location && (
          <span className="inline-flex items-center gap-1">
            <MapPinIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
            {unit.location}
          </span>
        )}
      </div>
    </Link>
  );
}
