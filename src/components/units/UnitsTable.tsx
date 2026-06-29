'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import type { UnitListItem } from '@/server/units';
import type { UnitStatus, VerifyState } from '@/types/inventory';
import { sortUnits, type SortDir, type SortKey } from '@/lib/sort-units';
import { bulkDeleteAction, type BulkDeleteState } from '@/app/(app)/units/actions';
import { StatusBadge } from './StatusBadge';
import { VerifyStateBadge } from './VerifyStateBadge';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'serialNumber', label: 'S/N' },
  { key: 'boxSerialNumber', label: 'รหัสรอง' },
  { key: 'category', label: 'หมวด' },
  { key: 'status', label: 'สถานะ' },
  { key: 'verifyState', label: 'การตรวจ' },
  { key: 'location', label: 'ตำแหน่ง' },
  { key: 'boxLocation', label: 'ที่เก็บรอง' },
  { key: 'note', label: 'หมายเหตุ' },
];

const cellMuted = 'text-gray-500 dark:text-gray-400';

function BulkDeleteSubmit({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/40 disabled:opacity-60"
    >
      {pending ? 'กำลังลบ…' : `ยืนยันลบ ${count} รายการ`}
    </button>
  );
}

export function UnitsTable({ units, isAdmin = false }: { units: UnitListItem[]; isAdmin?: boolean }) {
  const [sortKey, setSortKey] = useState<SortKey>('serialNumber');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [state, formAction] = useActionState<BulkDeleteState, FormData>(bulkDeleteAction, {});

  const sorted = sortUnits(units, sortKey, sortDir);

  // After a successful bulk delete the server data refreshes — clear selection.
  useEffect(() => {
    if (state.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset UI after action result
      setSelected(new Set());
      setConfirming(false);
    }
  }, [state.ok, state.deleted]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirming(false);
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === sorted.length ? new Set() : new Set(sorted.map((u) => u.id))));
    setConfirming(false);
  }

  const colSpan = COLUMNS.length + (isAdmin ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      {isAdmin && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
          <span className="text-sm font-medium text-red-800 dark:text-red-300">
            เลือก {selected.size} รายการ
          </span>
          {state.error && (
            <span role="alert" className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </span>
          )}
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="ml-auto h-11 rounded-lg border border-red-300 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50"
            >
              ลบที่เลือก
            </button>
          ) : (
            <form action={formAction} className="ml-auto flex items-center gap-2">
              <input type="hidden" name="ids" value={Array.from(selected).join(',')} />
              <BulkDeleteSubmit count={selected.size} />
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                ยกเลิก
              </button>
            </form>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full min-w-176 text-left text-sm">
          <thead className="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <tr>
              {isAdmin && (
                <th scope="col" className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="เลือกทั้งหมด"
                    checked={sorted.length > 0 && selected.size === sorted.length}
                    onChange={toggleAll}
                    className="size-4 accent-blue-600"
                  />
                </th>
              )}
              {COLUMNS.map((col) => {
                const active = col.key === sortKey;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="px-3 py-2 font-medium whitespace-nowrap"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      {col.label}
                      <span aria-hidden="true" className={active ? '' : 'opacity-30'}>
                        {active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {isAdmin && (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={`เลือก ${u.serialNumber ?? u.id}`}
                      checked={selected.has(u.id)}
                      onChange={() => toggleRow(u.id)}
                      className="size-4 accent-blue-600"
                    />
                  </td>
                )}
                <td className="px-3 py-2 font-medium whitespace-nowrap">
                  <Link
                    href={`/units/${u.id}`}
                    className="font-mono text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {u.serialNumber ?? <span className={`font-sans ${cellMuted}`}>ยังไม่มี S/N</span>}
                  </Link>
                </td>
                <td className="px-3 py-2 font-mono whitespace-nowrap text-gray-700 dark:text-gray-300">
                  {u.boxSerialNumber ?? <span className={`font-sans ${cellMuted}`}>—</span>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                  {u.category ?? <span className={cellMuted}>—</span>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <StatusBadge status={u.status as UnitStatus} />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <VerifyStateBadge state={u.verifyState as VerifyState} />
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                  {u.location ?? <span className={cellMuted}>—</span>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                  {u.boxLocation ?? <span className={cellMuted}>—</span>}
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  {u.note ? (
                    <span className="block max-w-56 truncate" title={u.note}>
                      {u.note}
                    </span>
                  ) : (
                    <span className={cellMuted}>—</span>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={colSpan} className={`px-3 py-6 text-center ${cellMuted}`}>
                  ไม่มีข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
