'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const OPTIONS = [
  { value: 'light', label: 'สว่าง', icon: '☀' },
  { value: 'dark', label: 'มืด', icon: '☾' },
  { value: 'system', label: 'อัตโนมัติ (ตามระบบ)', icon: '🖥' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid a hydration mismatch: the resolved theme is only known on the client.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes mount guard
  useEffect(() => setMounted(true), []);
  const current = mounted ? theme : undefined;

  return (
    <div
      role="group"
      aria-label="ธีมการแสดงผล"
      className="inline-flex items-center rounded-lg border border-gray-300 p-0.5 dark:border-gray-700"
    >
      {OPTIONS.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setTheme(o.value)}
            aria-pressed={active}
            title={o.label}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
              active
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <span aria-hidden="true">{o.icon}</span>
            <span className="sr-only">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
