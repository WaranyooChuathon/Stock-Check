import Link from 'next/link';
import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';

export default async function HomePage() {
  const session = await auth();
  const name = session?.user?.name ?? 'ผู้ใช้';
  const isAdmin = hasRole(session?.user?.role, ['admin']);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">สวัสดี {name}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          เลือกเมนูเพื่อเริ่มจัดการสต็อก
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">รายการสินค้า</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            ค้นหา ตรวจยืนยัน และจัดการสินค้ารายตัว
          </p>
          <Link
            href="/units"
            className="mt-3 inline-flex h-11 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
          >
            ไปที่รายการสินค้า
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            สินค้าที่มีปัญหา
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            รวมสินค้าที่ S/N ไม่ตรง หรืออุปกรณ์ไม่ครบ
          </p>
          <Link
            href="/problems"
            className="mt-3 inline-flex h-11 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ดูสินค้าที่มีปัญหา
          </Link>
        </div>

        {isAdmin && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">นำเข้าข้อมูล</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              นำเข้า Excel/CSV แล้วจับคู่คอลัมน์เอง
            </p>
            <Link
              href="/import"
              className="mt-3 inline-flex h-11 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              นำเข้า Excel/CSV
            </Link>
          </div>
        )}

        {isAdmin && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">ตั้งค่าอุปกรณ์</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              จัดการรายการอุปกรณ์ที่ใช้ตรวจยืนยัน
            </p>
            <Link
              href="/settings"
              className="mt-3 inline-flex h-11 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              จัดการรายการอุปกรณ์
            </Link>
          </div>
        )}

        {isAdmin && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">จัดการผู้ใช้</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              เพิ่มผู้ใช้ / รีเซ็ตรหัสผ่าน (admin/staff)
            </p>
            <Link
              href="/users"
              className="mt-3 inline-flex h-11 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              จัดการผู้ใช้
            </Link>
          </div>
        )}

        {isAdmin && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              บันทึกการเปลี่ยนแปลง
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              ประวัติทุกการกระทำ (นำเข้า/ตรวจ/แก้ไข/ลบ/กู้คืน)
            </p>
            <Link
              href="/audit"
              className="mt-3 inline-flex h-11 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              ดูบันทึก
            </Link>
          </div>
        )}

        {isAdmin && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">ถังขยะ</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              สินค้าที่ถูกลบ — กู้คืนหรือลบถาวร
            </p>
            <Link
              href="/trash"
              className="mt-3 inline-flex h-11 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              เปิดถังขยะ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
