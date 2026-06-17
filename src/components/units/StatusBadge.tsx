import { UNIT_STATUS_LABELS, type UnitStatus } from '@/types/inventory';

export function StatusBadge({ status }: { status: UnitStatus }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
      {UNIT_STATUS_LABELS[status]}
    </span>
  );
}
