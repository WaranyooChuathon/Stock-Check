/** Domain errors mapped to HTTP status codes at the API/action boundary. */

/** Resource does not exist (→ 404). */
export class NotFoundError extends Error {
  constructor(message = 'ไม่พบข้อมูล') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** Conflicting state, e.g. duplicate verified S/N or stale optimistic-lock version (→ 409). */
export class ConflictError extends Error {
  constructor(message = 'ข้อมูลขัดแย้ง') {
    super(message);
    this.name = 'ConflictError';
  }
}
