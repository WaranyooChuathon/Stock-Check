import { type NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireRole } from '@/lib/session-guard';
import { authErrorResponse } from '@/lib/api-auth';
import { parseUnitFilters } from '@/lib/unit-filters';
import { getUnitsForExport } from '@/server/export';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'staff']);
  } catch (error) {
    const response = authErrorResponse(error);
    if (response) return response;
    throw error;
  }

  const filters = parseUnitFilters(Object.fromEntries(request.nextUrl.searchParams));
  const rows = await getUnitsForExport(filters);

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'units');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  const filename = `stockcheck-items-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
