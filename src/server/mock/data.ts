import type { UnitStatus, VerifyState } from '../../types/inventory';

/**
 * Deterministic demo dataset — the single source of truth shared by the DB seed
 * (`prisma/seed.ts`) and the in-memory mock store (`src/server/mock/store.ts`).
 * Spans several product categories to show StockCheck is a *generic* asset
 * tracker, not signage-specific.
 */

/** Checklist items, scoped by category (null = applies to every category). */
export const CHECKLIST: {
  key: string;
  label: string;
  order: number;
  category: string | null;
}[] = [
  { key: 'manual', label: 'คู่มือ/ใบรับประกัน', order: 1, category: null },
  { key: 'ac', label: 'สายไฟ AC', order: 2, category: 'signage' },
  { key: 'wifi', label: 'เสา Wi-Fi', order: 3, category: 'signage' },
  { key: 'charger', label: 'อะแดปเตอร์ชาร์จ', order: 4, category: 'laptop' },
  { key: 'bag', label: 'กระเป๋า', order: 5, category: 'laptop' },
];

export type SeedItem = {
  serialNumber: string | null;
  boxSerialNumber: string | null;
  category: string;
  status: UnitStatus;
  verifyState: VerifyState;
  model: string;
  location: string | null;
  attributes?: Record<string, unknown>;
  /** checklist keys recorded as MISSING (drives discrepancy); others = present */
  missing?: string[];
  note?: string;
};

export const ITEMS: SeedItem[] = [
  // ── signage ──────────────────────────────────────────────
  {
    serialNumber: 'SGN-1001',
    boxSerialNumber: 'SW-1001',
    category: 'signage',
    status: 'in_stock',
    verifyState: 'verified',
    model: 'Smart Signage 18.5"',
    location: 'A1-ชั้น1',
    attributes: { displaySize: '18.5', macAddress: 'AA:BB:CC:00:10:01' },
  },
  {
    serialNumber: 'SGN-1002',
    boxSerialNumber: 'SW-1002',
    category: 'signage',
    status: 'lease_or_sold',
    verifyState: 'verified',
    model: 'Smart Signage 43"',
    location: null,
    attributes: { displaySize: '43', macAddress: 'AA:BB:CC:00:10:02' },
  },
  {
    serialNumber: 'SGN-2001',
    boxSerialNumber: 'SW-2001',
    category: 'signage',
    status: 'in_stock',
    verifyState: 'discrepancy',
    model: 'Smart Signage 32"',
    location: 'B2-ชั้น1',
    attributes: { displaySize: '32', macAddress: 'AA:BB:CC:00:20:01' },
    missing: ['wifi'],
    note: 'ขาดเสา Wi-Fi',
  },
  {
    serialNumber: 'SGN-3001',
    boxSerialNumber: 'SW-3001',
    category: 'signage',
    status: 'in_stock',
    verifyState: 'unverified',
    model: 'Smart Signage 24"',
    location: 'C1-ชั้น1',
    attributes: { displaySize: '24', macAddress: 'AA:BB:CC:00:30:01' },
  },

  // ── laptop ───────────────────────────────────────────────
  {
    serialNumber: 'LAP-5001',
    boxSerialNumber: 'AT-5001',
    category: 'laptop',
    status: 'in_stock',
    verifyState: 'verified',
    model: 'ThinkPad X1 Carbon',
    location: 'ตู้ IT-1',
    attributes: { cpu: 'Core i7', ram: '16GB', screen: '14"' },
  },
  {
    serialNumber: 'LAP-5002',
    boxSerialNumber: 'AT-5002',
    category: 'laptop',
    status: 'lease_or_sold',
    verifyState: 'discrepancy',
    model: 'MacBook Air M2',
    location: null,
    attributes: { cpu: 'Apple M2', ram: '8GB', screen: '13.6"' },
    missing: ['charger'],
    note: 'ยืมไปไม่คืนที่ชาร์จ',
  },
  {
    serialNumber: 'LAP-6001',
    boxSerialNumber: null,
    category: 'laptop',
    status: 'repair_lost',
    verifyState: 'unverified',
    model: 'Dell Latitude 7440',
    location: 'ส่งซ่อม',
    attributes: { cpu: 'Core i5', ram: '16GB' },
  },

  // ── tool (เครื่องมือช่าง) ─────────────────────────────────
  {
    serialNumber: 'TL-7001',
    boxSerialNumber: 'TL-BOX-7001',
    category: 'tool',
    status: 'in_stock',
    verifyState: 'verified',
    model: 'สว่านไร้สาย Makita',
    location: 'ชั้นวางเครื่องมือ',
    attributes: { voltage: '18V', แบตเตอรี่: '2 ก้อน' },
  },
  {
    serialNumber: 'TL-7002',
    boxSerialNumber: 'TL-BOX-7002',
    category: 'tool',
    status: 'trial',
    verifyState: 'unverified',
    model: 'เครื่องเจียร Bosch',
    location: 'ชั้นวางเครื่องมือ',
    attributes: { voltage: '220V' },
  },

  // ── furniture (เฟอร์นิเจอร์) ──────────────────────────────
  {
    serialNumber: 'FN-9001',
    boxSerialNumber: null,
    category: 'furniture',
    status: 'in_stock',
    verifyState: 'verified',
    model: 'โต๊ะทำงานปรับระดับ',
    location: 'โกดัง F1',
    attributes: { สี: 'ขาว', ขนาด: '120x60cm' },
  },
  {
    serialNumber: 'FN-9002',
    boxSerialNumber: null,
    category: 'furniture',
    status: 'in_stock',
    verifyState: 'discrepancy',
    model: 'เก้าอี้ ergonomic',
    location: 'โกดัง F1',
    attributes: { สี: 'ดำ' },
    missing: ['manual'],
    note: 'ไม่มีใบรับประกัน',
  },

  // ── messy import data (รก) ───────────────────────────────
  {
    serialNumber: 'SGN-DUP',
    boxSerialNumber: 'SW-DUP-A',
    category: 'signage',
    status: 'in_stock',
    verifyState: 'unverified',
    model: 'Smart Signage 24"',
    location: 'C2',
    attributes: { displaySize: '24' },
  },
  {
    serialNumber: 'SGN-DUP',
    boxSerialNumber: 'SW-DUP-B',
    category: 'signage',
    status: 'in_stock',
    verifyState: 'unverified',
    model: 'Smart Signage 24"',
    location: 'C2',
    attributes: { displaySize: '24' },
  },
  {
    serialNumber: null,
    boxSerialNumber: 'AT-6002',
    category: 'laptop',
    status: 'in_stock',
    verifyState: 'unverified',
    model: 'HP EliteBook',
    location: 'ตู้ IT-2',
  },
];
