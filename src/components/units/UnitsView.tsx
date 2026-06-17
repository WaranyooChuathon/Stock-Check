'use client';

import { useEffect, useState } from 'react';
import type { UnitListItem } from '@/server/units';
import { UnitCard } from './UnitCard';
import { UnitsTable } from './UnitsTable';

type View = 'cards' | 'table';

const btn = (active: boolean) =>
  `h-9 px-3 text-sm font-medium rounded-md transition-colors ${
    active
      ? 'bg-blue-600 text-white'
      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
  }`;

export function UnitsView({ units, isAdmin = false }: { units: UnitListItem[]; isAdmin?: boolean }) {
  const [view, setView] = useState<View>('cards');

  useEffect(() => {
    const saved = localStorage.getItem('unitsView');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted pref on mount
    if (saved === 'cards' || saved === 'table') setView(saved);
  }, []);

  function choose(v: View) {
    setView(v);
    localStorage.setItem('unitsView', v);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label="เลือกมุมมอง"
        className="inline-flex self-end rounded-lg border border-gray-300 p-0.5 dark:border-gray-700"
      >
        <button
          type="button"
          onClick={() => choose('cards')}
          aria-pressed={view === 'cards'}
          className={btn(view === 'cards')}
        >
          การ์ด
        </button>
        <button
          type="button"
          onClick={() => choose('table')}
          aria-pressed={view === 'table'}
          className={btn(view === 'table')}
        >
          ตาราง
        </button>
      </div>

      {view === 'cards' ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {units.map((unit) => (
            <li key={unit.id}>
              <UnitCard unit={unit} />
            </li>
          ))}
        </ul>
      ) : (
        <UnitsTable units={units} isAdmin={isAdmin} />
      )}
    </div>
  );
}
