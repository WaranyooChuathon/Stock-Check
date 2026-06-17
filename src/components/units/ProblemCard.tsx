import Link from 'next/link';
import type { ProblemUnit } from '@/server/problems';
import { StatusBadge } from './StatusBadge';

export function ProblemCard({ unit }: { unit: ProblemUnit }) {
  return (
    <Link
      href={`/units/${unit.id}`}
      className="block rounded-xl border border-red-200 bg-white p-4 transition-colors hover:bg-red-50/50 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-red-900 dark:bg-gray-900 dark:hover:bg-red-950/30"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate font-medium text-gray-900 dark:text-gray-100">
          {unit.serialNumber ?? (
            <span className="text-gray-500 dark:text-gray-400">ยังไม่มี S/N</span>
          )}
        </p>
        <StatusBadge status={unit.status} />
      </div>

      {unit.reasons.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-sm text-red-700 dark:text-red-400">
          {unit.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        {unit.category && <span>{unit.category}</span>}
        {unit.location && <span>📍 {unit.location}</span>}
      </div>
    </Link>
  );
}
