import Link from 'next/link';
import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';
import { listDeletedUnits } from '@/server/units';
import { listDeletionArchive, RETENTION_DAYS } from '@/server/delete-unit';
import { formatThaiDateTime } from '@/lib/datetime';
import { UNIT_STATUS_LABELS, type UnitStatus } from '@/types/inventory';
import { TrashItemActions } from './TrashItemActions';
import { PurgeExpiredButton } from './PurgeExpiredButton';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days left before a unit deleted at `deletedAt` becomes purgeable. */
function daysLeft(deletedAt: Date): number {
  const elapsed = Math.floor((Date.now() - deletedAt.getTime()) / DAY_MS);
  return RETENTION_DAYS - elapsed;
}

export default async function TrashPage() {
  const session = await auth();
  if (!hasRole(session?.user?.role, ['admin'])) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
      >
        หน้านี้สำหรับผู้ดูแล (admin) เท่านั้น
      </div>
    );
  }

  const [deleted, archive] = await Promise.all([listDeletedUnits(), listDeletionArchive()]);
  const expiredCount = deleted.filter((u) => u.deletedAt && daysLeft(u.deletedAt) <= 0).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/units" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← กลับไปรายการ
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">ถังขยะ</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          เครื่องที่ถูกลบ เก็บไว้ {RETENTION_DAYS} วันก่อนถูกลบถาวร — กู้คืนได้จนกว่าจะครบกำหนด
        </p>
      </div>

      <PurgeExpiredButton expiredCount={expiredCount} />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          ในถังขยะ ({deleted.length})
        </h2>
        {deleted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            ถังขยะว่าง
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {deleted.map((u) => {
              const left = u.deletedAt ? daysLeft(u.deletedAt) : RETENTION_DAYS;
              const expired = left <= 0;
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {u.serialNumber ?? 'ยังไม่มี S/N'}
                      {u.category ? (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {u.category}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {UNIT_STATUS_LABELS[u.status as UnitStatus]} · ลบโดย{' '}
                      {u.deletedBy?.username ?? '—'}
                      {u.deletedAt ? ` · ${formatThaiDateTime(u.deletedAt)}` : ''}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      expired
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {expired ? 'ครบกำหนด' : `เหลือ ${left} วัน`}
                  </span>
                  <div className="ml-auto">
                    <TrashItemActions unitId={u.id} serialNumber={u.serialNumber} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          ลบถาวรแล้ว ({archive.length})
        </h2>
        {archive.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">ยังไม่มีรายการที่ลบถาวร</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {archive.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-2.5 text-sm"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {a.serialNumber ?? '—'}
                </span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  ลบถาวรโดย {a.purgedBy.username} · {formatThaiDateTime(a.purgedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
