import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';
import { listUsers } from '@/server/users';
import { AddUserForm } from './AddUserForm';
import { ResetPasswordForm } from './ResetPasswordForm';

export default async function UsersPage() {
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

  const users = await listUsers();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">จัดการผู้ใช้</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          เพิ่มผู้ใช้ / รีเซ็ตรหัสผ่าน — มี 2 สิทธิ์: ผู้ดูแล, พนักงาน
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">เพิ่มผู้ใช้</h2>
        <AddUserForm />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          ผู้ใช้ทั้งหมด ({users.length})
        </h2>
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
              <span className="font-medium text-gray-900 dark:text-gray-100">{u.username}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {u.role === 'admin' ? 'ผู้ดูแล' : 'พนักงาน'}
              </span>
              <div className="ml-auto">
                <ResetPasswordForm userId={u.id} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
