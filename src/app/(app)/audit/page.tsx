import Link from 'next/link';
import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';
import { listAuditLog } from '@/server/audit';
import { listUsers } from '@/server/users';
import { formatThaiDateTime } from '@/lib/datetime';
import { CHANGE_ACTIONS, CHANGE_ACTION_LABELS, type ChangeAction } from '@/types/inventory';

const selectClass =
  'h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

const ACTION_BADGE: Record<ChangeAction, string> = {
  import: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  verify: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
  edit: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  restore: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
};

function isAction(v: string | undefined): v is ChangeAction {
  return !!v && (CHANGE_ACTIONS as readonly string[]).includes(v);
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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

  const sp = await searchParams;
  const actionParam = typeof sp.action === 'string' ? sp.action : undefined;
  const userParam = typeof sp.user === 'string' ? sp.user : undefined;
  const pageParam = Number(typeof sp.page === 'string' ? sp.page : 1);
  const action = isAction(actionParam) ? actionParam : undefined;

  const [log, users] = await Promise.all([
    listAuditLog({ action, userId: userParam || undefined, page: pageParam }),
    listUsers(),
  ]);

  const buildHref = (page: number) => {
    const qs = new URLSearchParams();
    if (action) qs.set('action', action);
    if (userParam) qs.set('user', userParam);
    if (page > 1) qs.set('page', String(page));
    const s = qs.toString();
    return `/audit${s ? `?${s}` : ''}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← กลับหน้าหลัก
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          บันทึกการเปลี่ยนแปลง
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          ประวัติทุกการกระทำกับสินค้า (นำเข้า/ตรวจ/แก้ไข/ลบ/กู้คืน) — ทั้งหมด {log.total} รายการ
        </p>
      </div>

      <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div className="flex flex-col gap-1">
          <label htmlFor="action" className="text-xs font-medium text-gray-500 dark:text-gray-400">
            ประเภท
          </label>
          <select id="action" name="action" defaultValue={action ?? ''} className={selectClass}>
            <option value="">ทั้งหมด</option>
            {CHANGE_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {CHANGE_ACTION_LABELS[a]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="user" className="text-xs font-medium text-gray-500 dark:text-gray-400">
            ผู้ใช้
          </label>
          <select id="user" name="user" defaultValue={userParam ?? ''} className={selectClass}>
            <option value="">ทั้งหมด</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
          >
            กรอง
          </button>
          <Link
            href="/audit"
            className="flex h-11 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ล้าง
          </Link>
        </div>
      </form>

      {log.rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          ไม่มีรายการตามเงื่อนไข
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
          {log.rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-4 py-3 text-sm">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_BADGE[r.action as ChangeAction]}`}
              >
                {CHANGE_ACTION_LABELS[r.action as ChangeAction] ?? r.action}
              </span>
              {r.unit ? (
                r.unit.deletedAt ? (
                  <span className="text-gray-700 dark:text-gray-300">
                    {r.unit.serialNumber ?? r.unit.id}{' '}
                    <span className="text-xs text-gray-400">(ในถังขยะ)</span>
                  </span>
                ) : (
                  <Link
                    href={`/units/${r.unit.id}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {r.unit.serialNumber ?? r.unit.id}
                  </Link>
                )
              ) : null}
              {r.field && (
                <span className="text-gray-600 dark:text-gray-400">
                  {r.field}: {r.oldValue ?? '—'} → {r.newValue ?? '—'}
                </span>
              )}
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                {r.user.username} · {formatThaiDateTime(r.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {log.pageCount > 1 && (
        <div className="flex items-center justify-between">
          {log.page > 1 ? (
            <Link
              href={buildHref(log.page - 1)}
              className="flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              ← ก่อนหน้า
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            หน้า {log.page} / {log.pageCount}
          </span>
          {log.page < log.pageCount ? (
            <Link
              href={buildHref(log.page + 1)}
              className="flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              ถัดไป →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
