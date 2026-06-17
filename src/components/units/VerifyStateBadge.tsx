import { VERIFY_STATE_LABELS, type VerifyState } from '@/types/inventory';

const styles: Record<VerifyState, string> = {
  verified:
    'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900',
  discrepancy:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
  unverified:
    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
};

export function VerifyStateBadge({ state }: { state: VerifyState }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[state]}`}
    >
      {VERIFY_STATE_LABELS[state]}
    </span>
  );
}
