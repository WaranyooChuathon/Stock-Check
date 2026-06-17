import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/session-guard';
import { authErrorResponse } from '@/lib/api-auth';
import { importUnits } from '@/server/import';

const rowSchema = z.object({
  serialNumber: z.string().nullable(),
  boxSerialNumber: z.string().nullable(),
  category: z.string().nullable(),
  status: z.string().nullable(),
  boxLocation: z.string().nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});
const bodySchema = z.object({ rows: z.array(rowSchema).min(1).max(10000) });

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireRole(['admin']);
  } catch (error) {
    const response = authErrorResponse(error);
    if (response) return response;
    throw error;
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'ข้อมูลนำเข้าไม่ถูกต้อง' }, { status: 400 });
  }

  const report = await importUnits(parsed.data.rows, user.id);
  return NextResponse.json({ report });
}
