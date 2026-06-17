import { type NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session-guard';
import { authErrorResponse } from '@/lib/api-auth';
import { parseUnitFilters } from '@/lib/unit-filters';
import { listUnits } from '@/server/units';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'staff']);
  } catch (error) {
    const response = authErrorResponse(error);
    if (response) return response;
    throw error;
  }

  const filters = parseUnitFilters(Object.fromEntries(request.nextUrl.searchParams));
  const units = await listUnits(filters);
  return NextResponse.json({ units });
}
