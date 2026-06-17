'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { UNIT_STATUSES, UNIT_STATUS_LABELS, type UnitStatus } from '@/types/inventory';

type FieldKey = 'serialNumber' | 'boxSerialNumber' | 'category' | 'status' | 'boxLocation';

const FIELDS: { key: FieldKey; label: string; defaultHeader: string }[] = [
  { key: 'serialNumber', label: 'S/N', defaultHeader: 'S/N' },
  { key: 'boxSerialNumber', label: 'รหัสรอง / asset tag', defaultHeader: 'รหัสรอง' },
  { key: 'category', label: 'หมวดสินค้า', defaultHeader: 'หมวด' },
  { key: 'status', label: 'สถานะ', defaultHeader: 'สถานะ' },
  { key: 'boxLocation', label: 'ที่เก็บรอง', defaultHeader: 'ที่เก็บรอง' },
];

type Row = Record<string, unknown>;
interface ImportReport {
  total: number;
  imported: number;
  skipped: number;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');

function autoMap(headers: string[]): Record<FieldKey, string> {
  const result = {} as Record<FieldKey, string>;
  for (const f of FIELDS) {
    const found = headers.find((h) => norm(h) === norm(f.defaultHeader));
    result[f.key] = found ?? '';
  }
  return result;
}

function guessStatus(raw: string): UnitStatus {
  const v = raw.toLowerCase();
  if (/(เช่า|ซื้อ|sold|lease)/.test(v)) return 'lease_or_sold';
  if (/(ทดสอบ|โครงการ|trial)/.test(v)) return 'trial';
  if (/(ซ่อม|เสีย|สูญ|repair|lost)/.test(v)) return 'repair_lost';
  return 'in_stock';
}

const cell = (row: Row, header: string): string | null => {
  if (!header) return null;
  const v = String(row[header] ?? '').trim();
  return v || null;
};

const selectClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

export function ImportClient() {
  const router = useRouter();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({} as Record<FieldKey, string>);
  const [statusMap, setStatusMap] = useState<Record<string, UnitStatus>>({});
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setReport(null);
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Row>(ws, { defval: '' });
      if (json.length === 0) {
        setError('ไฟล์ไม่มีข้อมูล');
        return;
      }
      const hdrs = Object.keys(json[0]);
      setHeaders(hdrs);
      setRows(json);
      const m = autoMap(hdrs);
      setMapping(m);
      // pre-guess status value mapping
      const sm: Record<string, UnitStatus> = {};
      if (m.status) {
        for (const r of json) {
          const raw = String(r[m.status] ?? '').trim();
          if (raw && !(raw in sm)) sm[raw] = guessStatus(raw);
        }
      }
      setStatusMap(sm);
    } catch {
      setError('อ่านไฟล์ไม่สำเร็จ (รองรับ .xlsx, .xls, .csv)');
    }
  }

  const statusValues = useMemo(() => {
    if (!mapping.status) return [];
    return [...new Set(rows.map((r) => String(r[mapping.status] ?? '').trim()).filter(Boolean))];
  }, [rows, mapping.status]);

  async function onImport() {
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const mappedHeaders = new Set(Object.values(mapping).filter(Boolean));
      const payload = rows.map((r) => {
        const attributes: Record<string, unknown> = {};
        for (const h of headers) {
          if (!mappedHeaders.has(h)) {
            const v = cell(r, h);
            if (v !== null) attributes[h] = v;
          }
        }
        const rawStatus = mapping.status ? String(r[mapping.status] ?? '').trim() : '';
        return {
          serialNumber: cell(r, mapping.serialNumber),
          boxSerialNumber: cell(r, mapping.boxSerialNumber),
          category: cell(r, mapping.category),
          boxLocation: cell(r, mapping.boxLocation),
          status: rawStatus ? (statusMap[rawStatus] ?? null) : null,
          attributes,
        };
      });

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'นำเข้าไม่สำเร็จ');
        return;
      }
      const body = await res.json();
      setReport(body.report);
      router.refresh();
    } catch {
      setError('นำเข้าไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="file" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          เลือกไฟล์ Excel/CSV
        </label>
        <input
          id="file"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFile}
          className="mt-1.5 block w-full text-sm file:mr-3 file:h-11 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400"
        >
          {error}
        </p>
      )}

      {headers.length > 0 && (
        <>
          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
              จับคู่คอลัมน์ ({rows.length} แถว)
            </h2>
            <div className="flex flex-col gap-3">
              {FIELDS.map((f) => (
                <div
                  key={f.key}
                  className="grid grid-cols-1 items-center gap-1.5 sm:grid-cols-[10rem_1fr]"
                >
                  <label
                    htmlFor={`map-${f.key}`}
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    {f.label}
                  </label>
                  <select
                    id={`map-${f.key}`}
                    value={mapping[f.key] ?? ''}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                    className={selectClass}
                  >
                    <option value="">— ไม่ใช้ —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          {statusValues.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                จับคู่ค่าสถานะ → สถานะระบบ
              </h2>
              <div className="flex flex-col gap-3">
                {statusValues.map((raw) => (
                  <div
                    key={raw}
                    className="grid grid-cols-1 items-center gap-1.5 sm:grid-cols-[10rem_1fr]"
                  >
                    <span className="truncate text-sm text-gray-700">{raw}</span>
                    <select
                      value={statusMap[raw] ?? 'in_stock'}
                      onChange={(e) =>
                        setStatusMap((s) => ({ ...s, [raw]: e.target.value as UnitStatus }))
                      }
                      className={selectClass}
                    >
                      {UNIT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {UNIT_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>
          )}

          <button
            type="button"
            onClick={onImport}
            disabled={busy}
            className="h-11 rounded-lg bg-blue-600 px-4 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'กำลังนำเข้า…' : `นำเข้า ${rows.length} แถว`}
          </button>
        </>
      )}

      {report && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400"
        >
          <p className="font-medium">นำเข้าเสร็จแล้ว</p>
          <ul className="mt-1 list-inside list-disc">
            <li>ทั้งหมด {report.total} แถว</li>
            <li>นำเข้าสำเร็จ {report.imported} รายการ (สถานะ: ยังไม่ตรวจ)</li>
            <li>ข้าม (แถวว่าง) {report.skipped} แถว</li>
          </ul>
        </div>
      )}
    </div>
  );
}
