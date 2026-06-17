/**
 * Domain enums for tracked items (any product category).
 *
 * The DB (PostgreSQL) stores these as native Prisma enums. These TS constants
 * mirror the enum values and add Thai display labels + a single source for Zod
 * validation at the API boundary, without coupling the UI to the generated
 * Prisma client.
 */

export const USER_ROLES = ['admin', 'staff'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** สถานะเครื่อง (disposition) */
export const UNIT_STATUSES = ['in_stock', 'lease_or_sold', 'trial', 'repair_lost'] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  in_stock: 'อยู่ในสต็อก',
  lease_or_sold: 'เช่าซื้อ/ซื้อขาด',
  trial: 'โครงการทดสอบ',
  repair_lost: 'ส่งซ่อม/เสีย/สูญหาย',
};

/** สถานะการตรวจยืนยัน */
export const VERIFY_STATES = ['unverified', 'verified', 'discrepancy'] as const;
export type VerifyState = (typeof VERIFY_STATES)[number];

export const VERIFY_STATE_LABELS: Record<VerifyState, string> = {
  unverified: 'ยังไม่ตรวจ',
  verified: 'ตรวจแล้ว',
  discrepancy: 'พบปัญหา',
};

/** ขนาดจอ (นิ้ว) — ค่า default; ผู้ใช้พ่วงค่าอื่นผ่าน attributes ได้ */
export const DISPLAY_SIZES = ['18.5', '24', '32', '43'] as const;
export type DisplaySize = (typeof DISPLAY_SIZES)[number];

/** ประเภท action ใน ChangeLog */
export const CHANGE_ACTIONS = ['import', 'verify', 'edit', 'delete', 'restore'] as const;
export type ChangeAction = (typeof CHANGE_ACTIONS)[number];

export const CHANGE_ACTION_LABELS: Record<ChangeAction, string> = {
  import: 'นำเข้า',
  verify: 'ตรวจยืนยัน',
  edit: 'แก้ไข',
  delete: 'ลบ',
  restore: 'กู้คืน',
};
