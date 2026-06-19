/**
 * Device presets and pure geometry helpers for the showcase (device-frame) mode.
 *
 * Everything here is DOM-free and side-effect-free so it can be unit-tested
 * without a browser. `ShowcaseFrame.tsx` consumes these to size the bezel/iframe
 * and to compute the fit-to-screen scale.
 */

export type DeviceId = '8.8' | '11' | 'web';
export type Orientation = 'portrait' | 'landscape';

export interface Dimensions {
  /** Logical CSS pixels. */
  width: number;
  height: number;
}

export interface DevicePreset {
  id: DeviceId;
  /** Thai label shown in the toolbar. */
  label: string;
  type: 'tablet' | 'web';
  /** Portrait logical viewport in CSS px. Ignored for `web` (fills container). */
  width: number;
  height: number;
}

/** Ordered for the toolbar: compact → large → full-width web. */
export const DEVICE_PRESETS: readonly DevicePreset[] = [
  { id: '8.8', label: 'แท็บเล็ต 8.8"', type: 'tablet', width: 820, height: 1180 },
  { id: '11', label: 'แท็บเล็ต 11"', type: 'tablet', width: 840, height: 1230 },
  { id: 'web', label: 'เว็บ', type: 'web', width: 0, height: 0 },
];

export const DEFAULT_DEVICE_ID: DeviceId = '11';
export const DEFAULT_ORIENTATION: Orientation = 'portrait';

const DEFAULT_PRESET = DEVICE_PRESETS.find((p) => p.id === DEFAULT_DEVICE_ID)!;

/** Look up a preset by id, falling back to the default for unknown/undefined ids. */
export function getPreset(id: DeviceId | string | undefined): DevicePreset {
  return DEVICE_PRESETS.find((p) => p.id === id) ?? DEFAULT_PRESET;
}

/** Swap width and height (portrait ↔ landscape). Its own inverse. */
export function rotate({ width, height }: Dimensions): Dimensions {
  return { width: height, height: width };
}

/**
 * Uniform scale (≤1) that makes `frame` fit inside `viewport`, preserving aspect
 * ratio. Never up-scales. `margin` (px, applied to each side of both axes) shrinks
 * the usable viewport so the frame isn't flush against the edges.
 */
export function fitScale(frame: Dimensions, viewport: Dimensions, margin = 0): number {
  const usableW = Math.max(0, viewport.width - margin * 2);
  const usableH = Math.max(0, viewport.height - margin * 2);
  if (frame.width <= 0 || frame.height <= 0) return 1;
  return Math.min(1, usableW / frame.width, usableH / frame.height);
}
