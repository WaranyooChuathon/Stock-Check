export type SortKey =
  | 'serialNumber'
  | 'boxSerialNumber'
  | 'category'
  | 'status'
  | 'verifyState'
  | 'location'
  | 'boxLocation'
  | 'note';

export type SortDir = 'asc' | 'desc';

const isEmpty = (v: string | null | undefined) => v == null || v === '';

/**
 * Pure client-side sort for the table view. Empty/null values always sort last
 * (regardless of direction); values compare by Thai locale. Returns a new array
 * (does not mutate the input).
 */
export function sortUnits<T extends Partial<Record<SortKey, string | null>>>(
  units: T[],
  key: SortKey,
  dir: SortDir,
): T[] {
  const factor = dir === 'asc' ? 1 : -1;

  return [...units].sort((a, b) => {
    const av = a[key];
    const bv = b[key];

    if (isEmpty(av) && isEmpty(bv)) return 0;
    if (isEmpty(av)) return 1; // nulls last
    if (isEmpty(bv)) return -1;

    return (av as string).localeCompare(bv as string, 'th') * factor;
  });
}
