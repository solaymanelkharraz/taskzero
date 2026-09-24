/**
 * Helper utilities to guarantee date operations strictly use UTC (GMT / UTC+0).
 * Prevents browser/OS timezone discrepancies (e.g. outdated GMT+1 offsets for Morocco)
 * from shifting dates or overwriting task assigned dates.
 */

export function getTodayStr() {
  const d = new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatHeaderDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(d));
}
