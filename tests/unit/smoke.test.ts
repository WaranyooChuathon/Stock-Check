import { describe, it, expect } from 'vitest';
import { appName } from '@/lib/app';

describe('toolchain smoke test', () => {
  it('resolves the @/* path alias and runs source under Vitest', () => {
    expect(appName()).toBe('StockCheck');
  });
});
