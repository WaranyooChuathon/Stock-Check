import { UNIT_STATUSES, VERIFY_STATES, type UnitStatus, type VerifyState } from '@/types/inventory';

export interface UnitFilters {
  /** free-text search across serialNumber / boxSerialNumber */
  q?: string;
  status?: UnitStatus;
  verifyState?: VerifyState;
  /** exact-match on product category */
  category?: string;
  /** contains-match on the item location */
  location?: string;
  /** filter by whether a box location is recorded */
  hasBox?: 'yes' | 'no';
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parse and validate raw URL search params into typed unit filters.
 * Invalid enum values and blank search terms are dropped (treated as absent).
 */
export function parseUnitFilters(params: RawParams): UnitFilters {
  const filters: UnitFilters = {};

  const q = first(params.q)?.trim();
  if (q) filters.q = q;

  const status = first(params.status);
  if (status && (UNIT_STATUSES as readonly string[]).includes(status)) {
    filters.status = status as UnitStatus;
  }

  const verifyState = first(params.verifyState);
  if (verifyState && (VERIFY_STATES as readonly string[]).includes(verifyState)) {
    filters.verifyState = verifyState as VerifyState;
  }

  const category = first(params.category)?.trim();
  if (category) filters.category = category;

  const location = first(params.location)?.trim();
  if (location) filters.location = location;

  const hasBox = first(params.hasBox);
  if (hasBox === 'yes' || hasBox === 'no') filters.hasBox = hasBox;

  return filters;
}
