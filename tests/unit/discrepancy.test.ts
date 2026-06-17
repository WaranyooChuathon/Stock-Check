import { describe, it, expect } from 'vitest';
import { evaluateDiscrepancy } from '@/server/discrepancy';

describe('evaluateDiscrepancy', () => {
  const present = (label: string) => ({ label, present: true, active: true });
  const missing = (label: string) => ({ label, present: false, active: true });

  it('no discrepancy when all active accessories are present', () => {
    const result = evaluateDiscrepancy({
      checklist: [present('สายไฟ AC'), present('เสา Wi-Fi')],
    });
    expect(result.hasDiscrepancy).toBe(false);
    expect(result.reasons).toEqual([]);
  });

  it('flags discrepancy when an active accessory is missing, listing it', () => {
    const result = evaluateDiscrepancy({
      checklist: [present('สายไฟ AC'), missing('เสา Wi-Fi')],
    });
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.reasons.some((r) => r.includes('เสา Wi-Fi'))).toBe(true);
  });

  it('ignores inactive checklist items even when not present', () => {
    const result = evaluateDiscrepancy({
      checklist: [{ label: 'รีโมท (เลิกใช้)', present: false, active: false }],
    });
    expect(result.hasDiscrepancy).toBe(false);
  });

  it('no discrepancy when there are no checklist items', () => {
    const result = evaluateDiscrepancy({ checklist: [] });
    expect(result.hasDiscrepancy).toBe(false);
  });
});
