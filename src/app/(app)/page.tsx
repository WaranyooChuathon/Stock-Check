import Link from 'next/link';
import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';
import { listUnits } from '@/server/units';
import {
  PackageIcon,
  UploadIcon,
  SlidersIcon,
  UsersIcon,
  HistoryIcon,
  TrashIcon,
  ChevronRightIcon,
} from '@/components/icons';

const TOOLS = [
  {
    href: '/import',
    label: 'นำเข้าข้อมูล',
    desc: 'นำเข้า Excel/CSV แล้วจับคู่คอลัมน์',
    icon: <UploadIcon />,
  },
  {
    href: '/settings',
    label: 'ตั้งค่าอุปกรณ์',
    desc: 'รายการอุปกรณ์ที่ใช้ตรวจยืนยัน',
    icon: <SlidersIcon />,
  },
  {
    href: '/users',
    label: 'จัดการผู้ใช้',
    desc: 'เพิ่มผู้ใช้ / รีเซ็ตรหัสผ่าน',
    icon: <UsersIcon />,
  },
  {
    href: '/audit',
    label: 'บันทึกการเปลี่ยนแปลง',
    desc: 'ประวัติทุกการกระทำในระบบ',
    icon: <HistoryIcon />,
  },
  {
    href: '/trash',
    label: 'ถังขยะ',
    desc: 'สินค้าที่ถูกลบ — กู้คืนหรือลบถาวร',
    icon: <TrashIcon />,
  },
];

export default async function HomePage() {
  const session = await auth();
  const name = session?.user?.name ?? 'ผู้ใช้';
  const isAdmin = hasRole(session?.user?.role, ['admin']);

  // State-first home: surface what needs attention, not a menu of cards.
  const units = await listUnits({});
  const total = units.length;
  const verified = units.filter((u) => u.verifyState === 'verified').length;
  const discrepancy = units.filter((u) => u.verifyState === 'discrepancy').length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">สวัสดี {name}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">ภาพรวมสต็อกวันนี้</p>
      </header>

      {/* Status readout — the instrument face: total · verified · discrepancy */}
      <div className="grid grid-cols-3 divide-x divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
        <div className="p-4 sm:p-5">
          <div className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {total}
          </div>
          <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">ทั้งหมด</div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-2xl font-semibold tabular-nums text-green-700 dark:text-green-400">
            {verified}
          </div>
          <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">ตรวจแล้ว</div>
        </div>
        <Link
          href="/problems"
          className="p-4 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600/40 sm:p-5 dark:hover:bg-gray-800"
        >
          <div
            className={`text-2xl font-semibold tabular-nums ${
              discrepancy > 0
                ? 'text-red-700 dark:text-red-400'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {discrepancy}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            พบปัญหา
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>

      {/* Primary task — the one prominent action */}
      <Link
        href="/units"
        className="flex items-center gap-4 rounded-xl bg-blue-600 p-5 text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15">
          <PackageIcon className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold">เปิดรายการสินค้า</span>
          <span className="block text-sm text-blue-100">
            ค้นหา ตรวจนับ และยืนยันสินค้ารายตัว
          </span>
        </span>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-blue-200" />
      </Link>

      {/* Admin tools — separated full-width blocks (not one stuck-together list) */}
      {isAdmin && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            เครื่องมือผู้ดูแล
          </h2>
          <div className="flex flex-col gap-3">
            {TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-800"
              >
                <span className="shrink-0 text-gray-400 dark:text-gray-500">{t.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t.label}
                  </span>
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                    {t.desc}
                  </span>
                </span>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
