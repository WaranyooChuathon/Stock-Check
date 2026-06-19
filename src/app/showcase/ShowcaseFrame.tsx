'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEVICE_PRESETS,
  DEFAULT_DEVICE_ID,
  DEFAULT_ORIENTATION,
  type DeviceId,
  type Dimensions,
  type Orientation,
  getPreset,
  rotate,
  fitScale,
} from './devices';

/** Thickness (px) of the tablet bezel drawn around the iframe. */
const BEZEL = 14;
/** Breathing room (px) kept around the frame when fitting it to the stage. */
const STAGE_MARGIN = 24;

/** Logical iframe size for the active preset + orientation. */
function frameDimensions(deviceId: DeviceId, orientation: Orientation): Dimensions {
  const preset = getPreset(deviceId);
  const base = { width: preset.width, height: preset.height };
  return orientation === 'landscape' ? rotate(base) : base;
}

export function ShowcaseFrame() {
  const [deviceId, setDeviceId] = useState<DeviceId>(DEFAULT_DEVICE_ID);
  const [orientation, setOrientation] = useState<Orientation>(DEFAULT_ORIENTATION);
  const [scale, setScale] = useState(1);

  const stageRef = useRef<HTMLDivElement>(null);
  const preset = getPreset(deviceId);
  const isWeb = preset.type === 'web';
  const dims = frameDimensions(deviceId, orientation);

  // Recompute the fit-to-screen scale whenever the stage resizes or dims change.
  const recompute = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || isWeb) {
      setScale(1);
      return;
    }
    const outer = { width: dims.width + BEZEL * 2, height: dims.height + BEZEL * 2 };
    setScale(
      fitScale(
        outer,
        { width: stage.clientWidth, height: stage.clientHeight },
        STAGE_MARGIN,
      ),
    );
  }, [dims.width, dims.height, isWeb]);

  useEffect(() => {
    recompute();
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(recompute);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [recompute]);

  return (
    <div className="flex h-dvh flex-col bg-gray-100 dark:bg-gray-950">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {DEVICE_PRESETS.map((p) => {
            const active = p.id === deviceId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setDeviceId(p.id)}
                aria-pressed={active}
                className={`flex h-9 min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors sm:min-h-0 ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setOrientation((o) => (o === 'portrait' ? 'landscape' : 'portrait'))}
          disabled={isWeb}
          aria-label="หมุนจอ"
          className="flex h-9 min-h-11 items-center gap-1.5 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 sm:min-h-0"
        >
          <span aria-hidden>⟳</span>
          {orientation === 'portrait' ? 'แนวตั้ง' : 'แนวนอน'}
        </button>
      </div>

      {/* Stage */}
      <div
        ref={stageRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2"
      >
        {isWeb ? (
          <iframe
            src="/"
            title="StockCheck — เว็บ"
            className="h-full w-full rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800"
          />
        ) : (
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            <div
              className="rounded-[2.25rem] bg-gray-900 shadow-2xl ring-1 ring-black/10 dark:bg-black"
              style={{ padding: BEZEL }}
            >
              <iframe
                src="/"
                title={`StockCheck — ${preset.label}`}
                className="block rounded-[1.4rem] bg-white"
                style={{ width: dims.width, height: dims.height, border: 0 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
