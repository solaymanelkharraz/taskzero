/**
 * Returns a Date object shifted so that its local time representation matches current UTC/GMT time.
 * Solves OS/browser timezone offsets (such as Morocco GMT+1 legacy browser offsets)
 * so date-fns and JS formatting always produce the correct GMT date and header titles.
 */
export function getNowUTC(d = new Date()) {
  const now = new Date(d);
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000);
}

export function getTodayStr() {
  const d = getNowUTC();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatHeaderDate(d = getNowUTC()) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(d);
}
