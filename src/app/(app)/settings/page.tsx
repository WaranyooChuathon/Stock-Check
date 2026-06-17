import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';
import { listAllChecklistItems } from '@/server/checklist';
import { AddChecklistForm } from './AddChecklistForm';
import { DeleteChecklistButton } from './DeleteChecklistButton';
import { toggleChecklistItemAction } from './actions';

export default async function SettingsPage() {
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

  const items = await listAllChecklistItems();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          ตั้งค่า: รายการอุปกรณ์ที่ตรวจ
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          อุปกรณ์ที่ active จะปรากฏในฟอร์มตรวจยืนยัน — เพิ่มรายการใหม่ไม่กระทบรายการที่ตรวจไปแล้ว
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <AddChecklistForm />
      </section>

      <section>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">ยังไม่มีรายการอุปกรณ์</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex-1 text-sm ${item.active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 line-through dark:text-gray-400'}`}
                >
                  {item.label}
                </span>
                {!item.active && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    ปิดใช้งาน
                  </span>
                )}
                <form action={toggleChecklistItemAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="active" value={(!item.active).toString()} />
                  <button
                    type="submit"
                    className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {item.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  </button>
                </form>
                <DeleteChecklistButton id={item.id} label={item.label} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
