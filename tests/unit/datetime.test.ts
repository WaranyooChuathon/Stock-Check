import { describe, it, expect } from 'vitest';
import { formatThaiDateTime } from '@/lib/datetime';

describe('formatThaiDateTime', () => {
  it('renders an instant in Asia/Bangkok (UTC+7) regardless of server tz', () => {
    // 2026-06-05 03:30 UTC → 10:30 in Bangkok
    const out = formatThaiDateTime(new Date('2026-06-05T03:30:00Z'));
    expect(out).toContain('10:30');
  });

  it('uses the Gregorian year (ค.ศ.), not the Buddhist year', () => {
    const out = formatThaiDateTime(new Date('2026-06-05T03:30:00Z'));
    expect(out).toContain('2026');
    expect(out).not.toContain('2569');
  });

  it('accepts an ISO string too', () => {
    const out = formatThaiDateTime('2026-01-01T00:00:00Z');
    // 1 Jan 2026 00:00 UTC → 07:00 Bangkok, still 2026
    expect(out).toContain('2026');
    expect(out).toContain('07:00');
  });
});
