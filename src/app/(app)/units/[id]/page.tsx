import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';
import { getUnitDetail, listCategories } from '@/server/units';
import { StatusBadge } from '@/components/units/StatusBadge';
import { VerifyStateBadge } from '@/components/units/VerifyStateBadge';
import { CHANGE_ACTION_LABELS, type UnitStatus, type VerifyState } from '@/types/inventory';
import { formatThaiDateTime } from '@/lib/datetime';
import { VerifyForm } from './VerifyForm';
import { EditForm } from './EditForm';
import { DeleteUnitButton } from './DeleteUnitButton';

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, session, categoryOptions] = await Promise.all([
    getUnitDetail(id),
    auth(),
    listCategories(),
  ]);
  if (!detail) notFound();
  const isAdmin = hasRole(session?.user?.role, ['admin']);

  const { unit, checklist, reasons, history } = detail;
  const verifyState = unit.verifyState as VerifyState;
  // category-specific specs carried in attributes (e.g. signage: displaySize/macAddress)
  const specs =
    unit.attributes && typeof unit.attributes === 'object' && !Array.isArray(unit.attributes)
      ? (unit.attributes as Record<string, unknown>)
      : {};
  const specEntries = Object.entries(specs).filter(([, v]) => v != null && v !== '');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/units" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← กลับไปรายการ
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {unit.serialNumber ? (
              <span className="font-mono">{unit.serialNumber}</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">ยังไม่มี S/N</span>
            )}
          </h1>
          <VerifyStateBadge state={verifyState} />
          <StatusBadge status={unit.status as UnitStatus} />
        </div>
      </div>

      {verifyState === 'discrepancy' && reasons.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30"
        >
          <p className="text-sm font-medium text-red-800 dark:text-red-400">พบปัญหา</p>
          <ul className="mt-1 list-inside list-disc text-sm text-red-700 dark:text-red-400">
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {(unit.category || specEntries.length > 0) && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
            ข้อมูลสินค้า
          </h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {unit.category && (
              <div className="flex justify-between gap-3 sm:block">
                <dt className="text-gray-500 dark:text-gray-400">หมวด</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{unit.category}</dd>
              </div>
            )}
            {specEntries.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 sm:block">
                <dt className="text-gray-500 dark:text-gray-400">{k}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
          ตรวจยืนยันสินค้า
        </h2>
        <VerifyForm
          unitId={unit.id}
          serialNumber={unit.serialNumber}
          category={unit.category}
          status={unit.status as UnitStatus}
          note={unit.note}
          checklist={checklist}
          categoryOptions={categoryOptions}
        />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
          แก้ไขข้อมูลสินค้า
        </h2>
        <EditForm
          unitId={unit.id}
          version={unit.version}
          boxSerialNumber={unit.boxSerialNumber}
          category={unit.category}
          model={unit.model}
          location={unit.location}
          boxLocation={unit.boxLocation}
          categoryOptions={categoryOptions}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          ประวัติการแก้ไข
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">ยังไม่มีประวัติ</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {history.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-2.5 text-sm"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {CHANGE_ACTION_LABELS[log.action] ?? log.action}
                </span>
                {log.field && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {log.field}: {log.oldValue ?? '—'} → {log.newValue ?? '—'}
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {log.user.username} · {formatThaiDateTime(log.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && <DeleteUnitButton unitId={unit.id} serialNumber={unit.serialNumber} />}
    </div>
  );
}
