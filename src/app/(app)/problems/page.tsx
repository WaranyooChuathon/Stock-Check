import { listProblemUnits } from '@/server/problems';
import { ProblemCard } from '@/components/units/ProblemCard';

export default async function ProblemsPage() {
  const units = await listProblemUnits();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          สินค้าที่มีปัญหา
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {units.length} รายการต้องตามเคลียร์
        </p>
      </div>

      {units.length === 0 ? (
        <div
          role="status"
          className="rounded-xl border border-dashed border-gray-300 py-12 text-center dark:border-gray-700"
        >
          <p className="text-2xl">🎉</p>
          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            ไม่มีสินค้าที่มีปัญหา
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            ทุกรายการที่ตรวจแล้วผ่านเรียบร้อย
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {units.map((unit) => (
            <li key={unit.id}>
              <ProblemCard unit={unit} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
