import { prisma } from '@/lib/prisma';
import { isDemoMode } from '@/lib/demo';
import { mockListAuditLog } from '@/server/mock/store';
import type { Prisma } from '@/generated/prisma/client';
import type { ChangeAction } from '@/types/inventory';

export interface AuditFilters {
  action?: ChangeAction;
  userId?: string;
  page?: number;
  perPage?: number;
}

const auditInclude = {
  user: { select: { username: true } },
  unit: { select: { id: true, serialNumber: true, deletedAt: true } },
} satisfies Prisma.ChangeLogInclude;

export type AuditRow = Prisma.ChangeLogGetPayload<{ include: typeof auditInclude }>;

export interface AuditPage {
  rows: AuditRow[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

/**
 * Paginated audit log (ChangeLog), newest first. Filterable by action and user.
 * Note: purging a unit cascade-deletes its log rows, so this shows the history
 * of units that still exist (active or in trash).
 */
export async function listAuditLog(filters: AuditFilters = {}): Promise<AuditPage> {
  if (isDemoMode()) return mockListAuditLog(filters) as AuditPage;
  const perPage = filters.perPage ?? 50;
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.ChangeLogWhereInput = {};
  if (filters.action) where.action = filters.action;
  if (filters.userId) where.userId = filters.userId;

  const [rows, total] = await Promise.all([
    prisma.changeLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: auditInclude,
    }),
    prisma.changeLog.count({ where }),
  ]);

  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}
