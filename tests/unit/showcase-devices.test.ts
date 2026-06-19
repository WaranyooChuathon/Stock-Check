import { describe, it, expect } from 'vitest';
import {
  DEVICE_PRESETS,
  DEFAULT_DEVICE_ID,
  DEFAULT_ORIENTATION,
  getPreset,
  rotate,
  fitScale,
} from '@/app/showcase/devices';

describe('DEVICE_PRESETS', () => {
  it('exposes the three expected presets', () => {
    expect(DEVICE_PRESETS.map((p) => p.id)).toEqual(['8.8', '11', 'web']);
  });

  it('tablet presets carry portrait logical dimensions; web does not', () => {
    const tablet88 = DEVICE_PRESETS.find((p) => p.id === '8.8')!;
    const tablet11 = DEVICE_PRESETS.find((p) => p.id === '11')!;
    const web = DEVICE_PRESETS.find((p) => p.id === 'web')!;

    expect(tablet88).toMatchObject({ type: 'tablet', width: 820, height: 1180 });
    expect(tablet11).toMatchObject({ type: 'tablet', width: 840, height: 1230 });
    // portrait → height taller than width
    expect(tablet88.height).toBeGreaterThan(tablet88.width);
    expect(tablet11.height).toBeGreaterThan(tablet11.width);
    expect(web.type).toBe('web');
  });
});

describe('getPreset', () => {
  it('returns the matching preset by id', () => {
    expect(getPreset('11').id).toBe('11');
    expect(getPreset('8.8').id).toBe('8.8');
    expect(getPreset('web').id).toBe('web');
  });

  it('falls back to the default preset for an unknown id', () => {
    expect(getPreset('nope').id).toBe(DEFAULT_DEVICE_ID);
    expect(getPreset(undefined).id).toBe(DEFAULT_DEVICE_ID);
  });

  it('default device id is 11" portrait', () => {
    expect(DEFAULT_DEVICE_ID).toBe('11');
    expect(DEFAULT_ORIENTATION).toBe('portrait');
  });
});

describe('rotate', () => {
  it('swaps width and height', () => {
    expect(rotate({ width: 820, height: 1180 })).toEqual({ width: 1180, height: 820 });
  });

  it('is its own inverse (rotating twice restores)', () => {
    const dims = { width: 840, height: 1230 };
    expect(rotate(rotate(dims))).toEqual(dims);
  });
});

describe('fitScale', () => {
  it('returns 1 when the frame already fits', () => {
    expect(fitScale({ width: 400, height: 600 }, { width: 1000, height: 1000 })).toBe(1);
  });

  it('never up-scales a small frame', () => {
    expect(fitScale({ width: 100, height: 100 }, { width: 5000, height: 5000 })).toBe(1);
  });

  it('scales down to fit the limiting dimension', () => {
    // height is the binding constraint: 600/1200 = 0.5
    expect(fitScale({ width: 800, height: 1200 }, { width: 5000, height: 600 })).toBe(0.5);
    // width is the binding constraint: 500/1000 = 0.5
    expect(fitScale({ width: 1000, height: 500 }, { width: 500, height: 5000 })).toBe(0.5);
  });

  it('preserves aspect ratio after scaling', () => {
    const frame = { width: 840, height: 1230 };
    const scale = fitScale(frame, { width: 420, height: 5000 });
    const scaledRatio = (frame.width * scale) / (frame.height * scale);
    expect(scaledRatio).toBeCloseTo(frame.width / frame.height, 10);
  });

  it('applies an optional margin that reduces the usable viewport', () => {
    // 16px margin each side → usable height 1200-32 = 1168; 1168/1200 ≈ 0.9733
    const scale = fitScale({ width: 100, height: 1200 }, { width: 5000, height: 1200 }, 16);
    expect(scale).toBeCloseTo(1168 / 1200, 10);
  });
});
