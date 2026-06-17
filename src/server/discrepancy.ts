/**
 * Pure discrepancy logic for a tracked item.
 *
 * A unit is flagged `discrepancy` ONLY when an *active* accessory checklist item
 * is missing from the box (อุปกรณ์ในกล่องขาด). The device serial and the
 * Software Setup Number (stored in `boxSerialNumber`) are NOT compared — they
 * are different identifiers and are not expected to match.
 *
 * Intentionally free of any DB/Prisma dependency so it can be unit-tested and
 * reused by both the verify flow and the detail/problems views.
 */

export interface ChecklistResult {
  label: string;
  present: boolean;
  active: boolean;
}

export interface DiscrepancyInput {
  checklist: ChecklistResult[];
}

export interface DiscrepancyResult {
  hasDiscrepancy: boolean;
  reasons: string[];
}

export function evaluateDiscrepancy(input: DiscrepancyInput): DiscrepancyResult {
  const missing = input.checklist
    .filter((item) => item.active && !item.present)
    .map((item) => item.label);

  const reasons = missing.length > 0 ? [`อุปกรณ์ไม่ครบ: ${missing.join(', ')}`] : [];
  return { hasDiscrepancy: reasons.length > 0, reasons };
}
