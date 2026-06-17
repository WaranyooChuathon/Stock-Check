import bcrypt from 'bcryptjs';
import { evaluateDiscrepancy, type ChecklistResult } from '@/server/discrepancy';
import { ConflictError, NotFoundError } from '@/lib/errors';
import type { UnitStatus, VerifyState, ChangeAction, UserRole } from '@/types/inventory';

/** Mirror of delete-unit's RETENTION_DAYS (kept local to avoid an import cycle). */
const RETENTION_DAYS = 30;
import { CHECKLIST, ITEMS } from './data';

/**
 * In-memory mock store backing demo mode (`isDemoMode()`), used when no
 * DATABASE_URL is configured. Built deterministically from the shared dataset in
 * `data.ts`. Mutations persist within a running instance; a cold start re-seeds,
 * which keeps the public demo tidy. Each service delegates here in demo mode.
 */

interface MUser {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}
interface MItem {
  id: string;
  serialNumber: string | null;
  boxSerialNumber: string | null;
  category: string | null;
  status: UnitStatus;
  verifyState: VerifyState;
  version: number;
  model: string | null;
  location: string | null;
  boxLocation: string | null;
  attributes: unknown;
  accessoryNote: string | null;
  note: string | null;
  verifiedById: string | null;
  verifiedAt: Date | null;
  deletedAt: Date | null;
  deletedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}
interface MChecklistItem {
  id: string;
  label: string;
  order: number;
  active: boolean;
  category: string | null;
}
interface MUnitChecklist {
  id: string;
  unitId: string;
  checklistItemId: string;
  present: boolean;
}
interface MChangeLog {
  id: string;
  unitId: string;
  userId: string;
  action: ChangeAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
}
interface MArchive {
  id: string;
  originalId: string;
  serialNumber: string | null;
  snapshot: unknown;
  deletedAt: Date | null;
  purgedAt: Date;
  purgedById: string;
}

interface Store {
  users: MUser[];
  items: MItem[];
  checklistItems: MChecklistItem[];
  unitChecklists: MUnitChecklist[];
  changeLogs: MChangeLog[];
  archive: MArchive[];
  seq: number;
}

const BASE = new Date('2026-06-15T03:00:00.000Z').getTime();

let store: Store | null = null;

function build(): Store {
  const s: Store = {
    users: [],
    items: [],
    checklistItems: [],
    unitChecklists: [],
    changeLogs: [],
    archive: [],
    seq: 0,
  };

  const admin: MUser = {
    id: 'u-admin',
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    createdAt: new Date(BASE),
  };
  s.users.push(admin, {
    id: 'u-staff',
    username: 'staff',
    passwordHash: bcrypt.hashSync('staff123', 10),
    role: 'staff',
    createdAt: new Date(BASE),
  });

  const checklistId = new Map<string, string>();
  for (const c of CHECKLIST) {
    const id = `c-${c.key}`;
    checklistId.set(c.key, id);
    s.checklistItems.push({ id, label: c.label, order: c.order, active: true, category: c.category });
  }

  ITEMS.forEach((it, i) => {
    const id = `i-${i + 1}`;
    const checked = it.verifyState !== 'unverified';
    const when = new Date(BASE - i * 60_000);
    s.items.push({
      id,
      serialNumber: it.serialNumber,
      boxSerialNumber: it.boxSerialNumber,
      category: it.category,
      status: it.status,
      verifyState: it.verifyState,
      version: 0,
      model: it.model,
      location: it.location,
      boxLocation: null,
      attributes: it.attributes ?? null,
      accessoryNote: null,
      note: it.note ?? null,
      verifiedById: checked ? admin.id : null,
      verifiedAt: checked ? when : null,
      deletedAt: null,
      deletedById: null,
      createdAt: when,
      updatedAt: when,
    });

    if (checked) {
      const relevant = CHECKLIST.filter((c) => c.category == null || c.category === it.category);
      const missing = new Set(it.missing ?? []);
      for (const c of relevant) {
        s.unitChecklists.push({
          id: `uc-${i + 1}-${c.key}`,
          unitId: id,
          checklistItemId: checklistId.get(c.key)!,
          present: !missing.has(c.key),
        });
      }
    }

    s.changeLogs.push({
      id: `cl-imp-${i + 1}`,
      unitId: id,
      userId: admin.id,
      action: 'import',
      field: null,
      oldValue: null,
      newValue: null,
      createdAt: when,
    });
    if (checked) {
      s.changeLogs.push({
        id: `cl-ver-${i + 1}`,
        unitId: id,
        userId: admin.id,
        action: 'verify',
        field: 'verifyState',
        oldValue: 'unverified',
        newValue: it.verifyState,
        createdAt: new Date(when.getTime() + 1000),
      });
    }
  });

  return s;
}

function db(): Store {
  if (!store) store = build();
  return store;
}

/** Rebuild the store from the seed dataset (used by the demo reset path). */
export function resetMockStore(): void {
  store = build();
}

const nextId = (prefix: string): string => `${prefix}-${(db().seq += 1)}`;
const clone = <T>(v: T): T => (v == null ? v : JSON.parse(JSON.stringify(v)));

// ── reads ─────────────────────────────────────────────────────────────────

interface MockFilters {
  q?: string;
  status?: string;
  verifyState?: string;
  category?: string;
  location?: string;
  hasBox?: 'yes' | 'no';
}

function activeItems(filters: MockFilters = {}): MItem[] {
  let rows = db().items.filter((u) => u.deletedAt == null);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter(
      (u) =>
        u.serialNumber?.toLowerCase().includes(q) || u.boxSerialNumber?.toLowerCase().includes(q),
    );
  }
  if (filters.status) rows = rows.filter((u) => u.status === filters.status);
  if (filters.verifyState) rows = rows.filter((u) => u.verifyState === filters.verifyState);
  if (filters.category) rows = rows.filter((u) => u.category === filters.category);
  if (filters.location)
    rows = rows.filter((u) => u.location?.toLowerCase().includes(filters.location!.toLowerCase()));
  if (filters.hasBox === 'yes') rows = rows.filter((u) => u.boxLocation != null);
  if (filters.hasBox === 'no') rows = rows.filter((u) => u.boxLocation == null);
  return rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function mockListUnits(filters: MockFilters) {
  return activeItems(filters).map((u) => ({
    id: u.id,
    serialNumber: u.serialNumber,
    boxSerialNumber: u.boxSerialNumber,
    category: u.category,
    status: u.status,
    verifyState: u.verifyState,
    location: u.location,
    boxLocation: u.boxLocation,
    note: u.note,
    updatedAt: u.updatedAt,
  }));
}

export function mockListCategories(): string[] {
  const set = new Set<string>();
  for (const u of db().items) if (u.deletedAt == null && u.category) set.add(u.category);
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function mockListDeletedUnits() {
  return db()
    .items.filter((u) => u.deletedAt != null)
    .sort((a, b) => (b.deletedAt!.getTime() ?? 0) - (a.deletedAt!.getTime() ?? 0))
    .map((u) => ({
      id: u.id,
      serialNumber: u.serialNumber,
      category: u.category,
      status: u.status,
      deletedAt: u.deletedAt,
      deletedById: u.deletedById,
      deletedBy: u.deletedById ? { username: username(u.deletedById) ?? '' } : null,
    }));
}

function username(userId: string): string | undefined {
  return db().users.find((x) => x.id === userId)?.username;
}

function recordedChecklist(unitId: string): ChecklistResult[] {
  const s = db();
  return s.unitChecklists
    .filter((c) => c.unitId === unitId)
    .map((c) => {
      const item = s.checklistItems.find((ci) => ci.id === c.checklistItemId);
      return { label: item?.label ?? '', present: c.present, active: item?.active ?? false };
    });
}

export function mockGetUnitDetail(id: string) {
  const s = db();
  const unit = s.items.find((u) => u.id === id);
  if (!unit || unit.deletedAt) return null;

  const recorded = s.unitChecklists
    .filter((c) => c.unitId === id)
    .map((c) => ({
      ...c,
      checklistItem: s.checklistItems.find((ci) => ci.id === c.checklistItemId)!,
    }));

  const { reasons } = evaluateDiscrepancy({ checklist: recordedChecklist(id) });

  const presentMap = new Map(recorded.map((c) => [c.checklistItemId, c.present]));
  const checklist = s.checklistItems
    .filter((ci) => ci.active && (ci.category == null || ci.category === unit.category))
    .sort((a, b) => a.order - b.order)
    .map((ci) => ({ id: ci.id, label: ci.label, present: presentMap.get(ci.id) ?? false }));

  const history = s.changeLogs
    .filter((l) => l.unitId === id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20)
    .map((l) => ({ ...clone(l), user: { username: username(l.userId) ?? '' } }));

  return { unit: { ...clone(unit), checklist: recorded }, checklist, reasons, history };
}

export function mockListProblemUnits() {
  return db()
    .items.filter((u) => u.deletedAt == null && u.verifyState === 'discrepancy')
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((u) => {
      const { reasons } = evaluateDiscrepancy({ checklist: recordedChecklist(u.id) });
      return {
        id: u.id,
        serialNumber: u.serialNumber,
        boxSerialNumber: u.boxSerialNumber,
        category: u.category,
        status: u.status,
        location: u.location,
        reasons,
      };
    });
}

export function mockListAuditLog(filters: { action?: string; userId?: string; page?: number; perPage?: number }) {
  const perPage = filters.perPage ?? 50;
  const page = Math.max(1, filters.page ?? 1);
  const s = db();
  let rows = [...s.changeLogs];
  if (filters.action) rows = rows.filter((l) => l.action === filters.action);
  if (filters.userId) rows = rows.filter((l) => l.userId === filters.userId);
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const total = rows.length;
  const slice = rows.slice((page - 1) * perPage, (page - 1) * perPage + perPage).map((l) => {
    const unit = s.items.find((u) => u.id === l.unitId);
    return {
      ...clone(l),
      user: { username: username(l.userId) ?? '' },
      unit: unit
        ? { id: unit.id, serialNumber: unit.serialNumber, deletedAt: unit.deletedAt }
        : null,
    };
  });
  return {
    rows: slice,
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export function mockGetUnitsForExport(filters: MockFilters) {
  return activeItems(filters).map((u) => {
    const row: Record<string, string | number> = {
      'S/N': u.serialNumber ?? '',
      รหัสรอง: u.boxSerialNumber ?? '',
      หมวด: u.category ?? '',
      รุ่น: u.model ?? '',
      สถานะ: u.status,
      การตรวจ: u.verifyState,
      ตำแหน่งเครื่อง: u.location ?? '',
      ตำแหน่งกล่อง: u.boxLocation ?? '',
      หมายเหตุ: u.note ?? '',
    };
    if (u.attributes && typeof u.attributes === 'object' && !Array.isArray(u.attributes)) {
      for (const [k, v] of Object.entries(u.attributes as Record<string, unknown>)) {
        if (!(k in row)) row[k] = v == null ? '' : String(v);
      }
    }
    return row;
  });
}

export function mockListAllChecklistItems() {
  return [...db().checklistItems]
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map(clone);
}

export function mockListUsers() {
  return [...db().users]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((u) => ({ id: u.id, username: u.username, role: u.role, createdAt: u.createdAt }));
}

export function mockVerifyCredentials(usernameInput: string, password: string) {
  const user = db().users.find((u) => u.username === usernameInput);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) return null;
  return { id: user.id, username: user.username, role: user.role };
}

export function mockListDeletionArchive(take = 50) {
  return [...db().archive]
    .sort((a, b) => b.purgedAt.getTime() - a.purgedAt.getTime())
    .slice(0, take)
    .map((a) => ({ ...clone(a), purgedBy: { username: username(a.purgedById) ?? '' } }));
}

// ── writes ────────────────────────────────────────────────────────────────

function findActive(id: string): MItem {
  const u = db().items.find((x) => x.id === id);
  if (!u || u.deletedAt) throw new NotFoundError('ไม่พบรายการนี้');
  return u;
}

function log(entry: Omit<MChangeLog, 'id' | 'createdAt'>): void {
  db().changeLogs.push({ ...entry, id: nextId('cl'), createdAt: new Date() });
}

export function mockVerifyUnit(
  unitId: string,
  input: { serialNumber: string | null; category: string | null; status: UnitStatus; checklist: { checklistItemId: string; present: boolean }[]; note?: string | null },
  actorUserId: string,
) {
  const s = db();
  const unit = findActive(unitId);

  const checklistForEval: ChecklistResult[] = input.checklist.map((c) => {
    const item = s.checklistItems.find((ci) => ci.id === c.checklistItemId);
    return { label: item?.label ?? '', present: c.present, active: item?.active ?? false };
  });
  const { hasDiscrepancy, reasons } = evaluateDiscrepancy({ checklist: checklistForEval });
  const verifyState: VerifyState = hasDiscrepancy ? 'discrepancy' : 'verified';

  if (verifyState === 'verified' && input.serialNumber) {
    const clash = s.items.find(
      (u) => u.id !== unitId && u.serialNumber === input.serialNumber && u.verifyState === 'verified',
    );
    if (clash) throw new ConflictError(`S/N ${input.serialNumber} มีรายการที่ยืนยันแล้วในระบบ`);
  }

  const serialChanged = unit.serialNumber !== input.serialNumber;

  for (const c of input.checklist) {
    const existing = s.unitChecklists.find(
      (x) => x.unitId === unitId && x.checklistItemId === c.checklistItemId,
    );
    if (existing) existing.present = c.present;
    else
      s.unitChecklists.push({
        id: nextId('uc'),
        unitId,
        checklistItemId: c.checklistItemId,
        present: c.present,
      });
  }

  unit.serialNumber = input.serialNumber;
  unit.category = input.category;
  unit.status = input.status;
  if (input.note !== undefined) unit.note = input.note;
  unit.verifyState = verifyState;
  unit.verifiedById = actorUserId;
  unit.verifiedAt = new Date();
  unit.version += 1;
  unit.updatedAt = new Date();

  log({ unitId, userId: actorUserId, action: 'verify', field: 'verifyState', oldValue: unit.verifyState, newValue: verifyState });
  if (serialChanged)
    log({ unitId, userId: actorUserId, action: 'edit', field: 'serialNumber', oldValue: null, newValue: input.serialNumber });

  return { verifyState, reasons };
}

export function mockUpdateUnit(
  unitId: string,
  input: { boxSerialNumber: string | null; category: string | null; model: string | null; location: string | null; boxLocation: string | null },
  expectedVersion: number,
  actorUserId: string,
) {
  const unit = findActive(unitId);
  if (unit.version !== expectedVersion)
    throw new ConflictError('ข้อมูลถูกแก้ไขโดยผู้อื่นไปแล้ว กรุณาโหลดใหม่');

  const fields: (keyof typeof input)[] = ['boxSerialNumber', 'category', 'model', 'location', 'boxLocation'];
  for (const f of fields) {
    if (unit[f] !== input[f]) {
      log({ unitId, userId: actorUserId, action: 'edit', field: f, oldValue: (unit[f] as string) ?? null, newValue: input[f] });
      (unit as unknown as Record<string, unknown>)[f] = input[f];
    }
  }
  unit.version += 1;
  unit.updatedAt = new Date();
  return { version: expectedVersion + 1 };
}

export function mockImportUnits(
  rows: { serialNumber: string | null; boxSerialNumber: string | null; category: string | null; status: string | null; boxLocation?: string | null; attributes?: Record<string, unknown> }[],
  actorUserId: string,
) {
  const s = db();
  let imported = 0;
  let skipped = 0;
  const blank = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
  for (const raw of rows) {
    const serialNumber = blank(raw.serialNumber);
    const boxSerialNumber = blank(raw.boxSerialNumber);
    if (!serialNumber && !boxSerialNumber) {
      skipped += 1;
      continue;
    }
    const status = (['in_stock', 'lease_or_sold', 'trial', 'repair_lost'] as const).includes(
      raw.status as UnitStatus,
    )
      ? (raw.status as UnitStatus)
      : 'in_stock';
    const id = nextId('i');
    const now = new Date();
    s.items.push({
      id,
      serialNumber,
      boxSerialNumber,
      category: blank(raw.category),
      status,
      verifyState: 'unverified',
      version: 0,
      model: null,
      location: null,
      boxLocation: blank(raw.boxLocation),
      attributes: raw.attributes && Object.keys(raw.attributes).length > 0 ? raw.attributes : null,
      accessoryNote: null,
      note: null,
      verifiedById: null,
      verifiedAt: null,
      deletedAt: null,
      deletedById: null,
      createdAt: now,
      updatedAt: now,
    });
    log({ unitId: id, userId: actorUserId, action: 'import', field: null, oldValue: null, newValue: null });
    imported += 1;
  }
  return { total: rows.length, imported, skipped };
}

export function mockSoftDeleteUnit(unitId: string, actorUserId: string): void {
  const unit = findActive(unitId);
  const deletedAt = new Date();
  unit.deletedAt = deletedAt;
  unit.deletedById = actorUserId;
  unit.version += 1;
  log({ unitId, userId: actorUserId, action: 'delete', field: 'deletedAt', oldValue: null, newValue: deletedAt.toISOString() });
}

export function mockSoftDeleteUnits(unitIds: string[], actorUserId: string): number {
  let n = 0;
  for (const id of unitIds) {
    const unit = db().items.find((u) => u.id === id && u.deletedAt == null);
    if (!unit) continue;
    const deletedAt = new Date();
    unit.deletedAt = deletedAt;
    unit.deletedById = actorUserId;
    unit.version += 1;
    log({ unitId: id, userId: actorUserId, action: 'delete', field: 'deletedAt', oldValue: null, newValue: deletedAt.toISOString() });
    n += 1;
  }
  return n;
}

export function mockRestoreUnit(unitId: string, actorUserId: string): void {
  const unit = db().items.find((u) => u.id === unitId && u.deletedAt != null);
  if (!unit) throw new NotFoundError('ไม่พบรายการในถังขยะ');
  unit.deletedAt = null;
  unit.deletedById = null;
  unit.version += 1;
  log({ unitId, userId: actorUserId, action: 'restore', field: 'deletedAt', oldValue: null, newValue: null });
}

export function mockPurgeUnit(unitId: string, actorUserId: string): void {
  const s = db();
  const idx = s.items.findIndex((u) => u.id === unitId);
  if (idx === -1) throw new NotFoundError('ไม่พบรายการนี้');
  const unit = s.items[idx];
  s.archive.push({
    id: nextId('arc'),
    originalId: unit.id,
    serialNumber: unit.serialNumber,
    snapshot: clone(unit),
    deletedAt: unit.deletedAt,
    purgedAt: new Date(),
    purgedById: actorUserId,
  });
  s.items.splice(idx, 1);
  s.unitChecklists = s.unitChecklists.filter((c) => c.unitId !== unitId);
  s.changeLogs = s.changeLogs.filter((l) => l.unitId !== unitId);
}

export function mockPurgeExpired(actorUserId: string, days: number = RETENTION_DAYS): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const expired = db().items.filter((u) => u.deletedAt != null && u.deletedAt.getTime() < cutoff);
  for (const u of expired) mockPurgeUnit(u.id, actorUserId);
  return expired.length;
}

export function mockCreateChecklistItem(label: string) {
  const s = db();
  const max = s.checklistItems.reduce((m, c) => Math.max(m, c.order), 0);
  const item: MChecklistItem = { id: nextId('c'), label, order: max + 1, active: true, category: null };
  s.checklistItems.push(item);
  return clone(item);
}

export function mockSetChecklistItemActive(id: string, active: boolean) {
  const item = db().checklistItems.find((c) => c.id === id);
  if (!item) throw new NotFoundError('ไม่พบรายการ');
  item.active = active;
  return clone(item);
}

export function mockDeleteChecklistItem(id: string) {
  const s = db();
  const idx = s.checklistItems.findIndex((c) => c.id === id);
  if (idx === -1) throw new NotFoundError('ไม่พบรายการ');
  const [removed] = s.checklistItems.splice(idx, 1);
  s.unitChecklists = s.unitChecklists.filter((c) => c.checklistItemId !== id);
  return clone(removed);
}

export function mockCreateUser(usernameInput: string, password: string, role: UserRole) {
  const s = db();
  if (s.users.some((u) => u.username === usernameInput))
    throw new ConflictError(`มีผู้ใช้ชื่อ "${usernameInput}" อยู่แล้ว`);
  const user: MUser = {
    id: nextId('u'),
    username: usernameInput,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    createdAt: new Date(),
  };
  s.users.push(user);
  return { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt };
}

export function mockResetPassword(userId: string, newPassword: string): void {
  const user = db().users.find((u) => u.id === userId);
  if (!user) throw new NotFoundError('ไม่พบผู้ใช้');
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
}
