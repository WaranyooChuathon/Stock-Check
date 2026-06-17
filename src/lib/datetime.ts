const thaiDateTime = new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
  timeZone: 'Asia/Bangkok',
  dateStyle: 'medium',
  timeStyle: 'short',
  hourCycle: 'h23',
});

/**
 * Format a date/instant as Thai-locale text in the Asia/Bangkok timezone using
 * the Gregorian year (ค.ศ.). Independent of the server timezone — important
 * because Vercel runs in UTC.
 */
export function formatThaiDateTime(value: Date | string | number): string {
  return thaiDateTime.format(new Date(value));
}
