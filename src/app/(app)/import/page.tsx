import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';
import { ImportClient } from './ImportClient';

export default async function ImportPage() {
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

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          นำเข้าข้อมูลจาก Excel/CSV
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          อัปโหลดไฟล์ แล้วจับคู่คอลัมน์เอง — แถว S/N ซ้ำ/ว่างจะถูกนำเข้าและติดธง “พบปัญหา”
          ไว้ตามเคลียร์
        </p>
      </div>
      <ImportClient />
    </div>
  );
}
