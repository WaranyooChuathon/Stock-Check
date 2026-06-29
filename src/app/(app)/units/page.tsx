import Link from 'next/link';
import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';
import { parseUnitFilters } from '@/lib/unit-filters';
import { listUnits, listCategories } from '@/server/units';
import { UnitsView } from '@/components/units/UnitsView';
import { UnitFiltersForm } from '@/components/units/UnitFiltersForm';
import { DownloadIcon } from '@/components/icons';

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseUnitFilters(await searchParams);
  const [units, session, categoryOptions] = await Promise.all([
    listUnits(filters),
    auth(),
    listCategories(),
  ]);
  const isAdmin = hasRole(session?.user?.role, ['admin']);

  const exportQuery = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v != null) as [string, string][],
  ).toString();
  const exportHref = `/api/units/export${exportQuery ? `?${exportQuery}` : ''}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">รายการสินค้า</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            พบ {units.length} รายการ
          </p>
        </div>
        <a
          href={exportHref}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <DownloadIcon className="h-4 w-4" />
          Export
        </a>
      </div>

      <UnitFiltersForm filters={filters} categoryOptions={categoryOptions} />

      {units.length === 0 ? (
        <div
          role="status"
          className="rounded-xl border border-dashed border-gray-300 py-12 text-center dark:border-gray-700"
        >
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            ไม่พบสินค้าตามเงื่อนไข
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ลองปรับคำค้นหรือตัวกรอง</p>
          <Link
            href="/units"
            className="mt-4 inline-flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ล้างตัวกรอง
          </Link>
        </div>
      ) : (
        <UnitsView units={units} isAdmin={isAdmin} />
      )}
    </div>
  );
}
